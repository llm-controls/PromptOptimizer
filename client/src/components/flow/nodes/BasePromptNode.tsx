import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Info } from 'lucide-react';
import { useFlowStore } from '@/store/flowstore';
import { BasePromptNodeData, MetaPromptNodeData, VariationsNodeData } from '@/Types/flowTypes';
import { ModelSelector } from '@/components/model-selector';
import { generateMetaPrompt, generateVariations, generateTestCases } from '@/lib/ai-providers';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { useAutoMode } from '@/hooks/use-auto-mode';
import { debounce } from 'lodash';

// Example prompts for inspiration
const EXAMPLE_PROMPTS = [
  "I want an AI assistant that helps users write high-converting marketing copy for their products",
  "I need an AI that can help users learn programming concepts through interactive tutorials",
  "I want an AI that can assist writers with creative story development and character creation",
  "I need an AI that can analyze financial data and provide investment recommendations",
  "I want an AI that can help healthcare professionals diagnose common illnesses based on symptoms"
];

// Helper function to safely access node data with type assertions
const getNodeData = <T,>(node: any, property: string): T | undefined => {
  if (node && node.data && property in node.data) {
    return node.data[property] as T;
  }
  return undefined;
};

// Base Prompt Node component
const BasePromptNode: React.FC<NodeProps<BasePromptNodeData>> = ({ id, data }) => {
  // Initialize state with fallback values to prevent undefined issues
  const [basePrompt, setBasePrompt] = useState(data.basePrompt || '');
  const [modelConfig, setModelConfig] = useState(data.modelConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(data.isAutoMode || false);
  // Get flow store actions
  const { updateNodeData, getNodeByType } = useFlowStore();
  const { toast } = useToast();
  
  // Use our new auto mode hook
  const { isRunning, runAutoMode } = useAutoMode();

  // Update local state when node data changes externally
  useEffect(() => {
    // Only update if values actually changed and are defined
    if (data.basePrompt !== undefined && data.basePrompt !== basePrompt) {
      console.log("📥 Updating basePrompt from external data:", data.basePrompt);
      setBasePrompt(data.basePrompt);
    }
    
    if (data.modelConfig !== undefined && JSON.stringify(data.modelConfig) !== JSON.stringify(modelConfig)) {
      console.log("📥 Updating modelConfig from external data:", data.modelConfig);
      setModelConfig(data.modelConfig);
    }
    
    if (data.isAutoMode !== undefined && data.isAutoMode !== autoMode) {
      console.log("📥 Updating autoMode from external data:", data.isAutoMode);
      setAutoMode(data.isAutoMode);
    }
  }, [data, basePrompt, modelConfig, autoMode]);

  // Set a random example prompt
  const setRandomExample = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
    const examplePrompt = EXAMPLE_PROMPTS[randomIndex];
    
    console.log("🎲 Setting random example prompt:", examplePrompt.substring(0, 30) + "...");
    setBasePrompt(examplePrompt);
    // Update flow store
    updateNodeData(id, { basePrompt: examplePrompt });
  };
  
  // Create debounced update function
  const debouncedUpdateNodeData = useCallback(
    debounce((newPrompt: string) => {
      console.log("📝 Debounced update with prompt:", newPrompt.substring(0, 30) + "...");
      updateNodeData(id, { basePrompt: newPrompt });
    }, 500),
    [id, updateNodeData]
  );
  
  // Handle text change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBasePrompt(newValue);
    setError(null);
    debouncedUpdateNodeData(newValue);
  };

  // Handle prompt generation or auto mode run
  const handleAction = async () => {
    // Input validation
    if (!basePrompt.trim()) {
      const errorMsg = "Please enter a base prompt";
      console.error("❌ Validation error:", errorMsg);
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    // Reset error state
    setError(null);
    
    if (autoMode) {
      // Auto Mode: Run the entire workflow
      console.log("🚀 Starting Auto Mode from BasePromptNode");
      
      // First update the node data to mark auto mode as active
      updateNodeData(id, { 
        basePrompt, 
        modelConfig,
        isAutoMode: true 
      });
      
      try {
        // Run auto mode and let it handle the entire flow
        await runAutoMode(basePrompt, modelConfig);
        console.log("✅ Auto Mode completed successfully");
        
        toast({
          title: 'Auto Mode Completed',
          description: 'The workflow has been processed successfully',
        });
      } catch (error) {
        // Handle auto mode errors
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during auto mode execution';
        console.error("❌ Auto Mode failed:", errorMessage);
        
        setError(errorMessage);
        toast({
          title: 'Auto Mode Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        // Mark auto mode as finished regardless of success/failure
        updateNodeData(id, { isAutoMode: false });
      }
    } else {
      // Regular Mode: Only generate meta prompt
      console.log("🔍 Starting Meta Prompt generation");
      setIsGenerating(true);
      
      // Update node data
      updateNodeData(id, { basePrompt, modelConfig });

      try {
        // Update meta prompt node to indicate generation is in progress
        const metaPromptNode = getNodeByType('metaPromptNode');
        if (metaPromptNode) {
          console.log("📝 Setting metaPromptNode to generating state");
          updateNodeData(metaPromptNode.id, { isGenerating: true });
        } else {
          console.warn("⚠️ metaPromptNode not found");
        }

        // Generate meta prompt
        console.log("🔄 Calling generateMetaPrompt API");
        const generatedPrompt = await generateMetaPrompt(basePrompt, modelConfig);
        console.log("✅ Meta prompt generated successfully");
        
        // Validate the meta prompt
        if (generatedPrompt.length < 50 || generatedPrompt === basePrompt) {
          throw new Error("Generated meta prompt is too short or identical to input");
        }
        
        // Update meta prompt node with generated content
        if (metaPromptNode) {
          const metaPromptData = {
            id: 0,
            basePrompt,
            generatedPrompt,
            modelConfig,
          };
          
          console.log("📝 Updating metaPromptNode with generated content");
          updateNodeData(metaPromptNode.id, {
            basePrompt,
            metaPrompt: metaPromptData,
            isGenerating: false,
          });
          
          toast({
            title: 'Success',
            description: 'Meta prompt generated successfully',
          });
          
          // Optionally scroll the user to the next node
          const reactFlowWrapper = document.querySelector('.react-flow__pane');
          if (reactFlowWrapper) {
            setTimeout(() => {
              reactFlowWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
          }
        } else {
          throw new Error("Meta prompt node not found");
        }
      } catch (error) {
        // Set error state
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during generation';
        console.error("❌ Meta prompt generation failed:", errorMessage);
        setError(errorMessage);
        
        toast({
          title: 'Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // Reset meta prompt node generation state
        const metaPromptNode = getNodeByType('metaPromptNode');
        if (metaPromptNode) {
          console.log("📝 Resetting metaPromptNode generation state after error");
          updateNodeData(metaPromptNode.id, { isGenerating: false });
        }
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <Card className="w-96 shadow-md">
      <CardHeader className="bg-primary/10 py-3 flex flex-row justify-between items-center">
        <CardTitle className="text-lg flex items-center">
          Base Prompt
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 ml-2 cursor-help text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Describe what you want today.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <Label>What are you building today?</Label>
          <Textarea
            placeholder="e.g., I want an AI that helps with writing blog posts"
            value={basePrompt}
            onChange={handlePromptChange}
            className={`min-h-20 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={setRandomExample}
              className="text-xs"
              disabled={isGenerating || isRunning}
            >
              Use Example
            </Button>
            
            <div className="flex items-center space-x-2 bg-gradient-to-r from-violet-100 to-amber-100 dark:from-violet-950 dark:to-amber-950 px-3 py-1 rounded-md border border-violet-200 dark:border-violet-800 shadow-sm">
              <Checkbox 
                id="auto-mode" 
                checked={autoMode} 
                onCheckedChange={(checked) => {
                  console.log("🔄 Auto mode changed to:", !!checked);
                  setAutoMode(!!checked);
                  // Sync with flow store
                  updateNodeData(id, { isAutoMode: !!checked });
                }}
                className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
              />
              <Label htmlFor="auto-mode" className="text-xs cursor-pointer font-medium">
                Auto Mode
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-amber-600 dark:text-amber-400" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="max-w-xs text-xs">
                      Auto Mode automatically completes the entire workflow up to the Model Arena.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Model Configuration</Label>
          <ModelSelector
            value={modelConfig}
            onChange={(newConfig) => {
              console.log("🟡 ModelSelector Change Triggered:", newConfig); 
              if (newConfig) {
                setModelConfig(newConfig);
                updateNodeData(id, { modelConfig: newConfig }); 
              } else {
                console.warn("⚠️ Received undefined model config");
              }
           }}
           />
        </div>

        <Button
          onClick={handleAction}
          className={`w-full ${autoMode ? 'bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-700 hover:to-amber-700 border-0 shadow-md' : ''}`}
          disabled={(isGenerating || isRunning) || !basePrompt.trim()}
        >
          {(isGenerating || isRunning) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {autoMode ? 'Running Auto Mode...' : 'Generating...'}
            </>
          ) : (
            autoMode ? (
              <>
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Run Auto Mode
              </>
            ) : 'Generate Meta Prompt'
          )}
        </Button>
      </CardContent>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="w-3 h-3 bg-primary"
      />
    </Card>
  );
};

export default BasePromptNode;