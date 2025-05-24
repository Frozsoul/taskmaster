
"use client";
import { useAppData } from "@/context/AppDataContext";
import type { Task, Priority, PrioritizedTaskSuggestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wand2, Check, X, Info } from "lucide-react";
import { TASK_PRIORITIES } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export function PrioritizationTool() {
  const { tasks, prioritizedSuggestions, suggestTaskPrioritization, updateTaskPriority, isLoadingAi } = useAppData();

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Urgent': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'default';
    }
  };

  const handleApplySuggestion = (taskId: string, suggestedPriority: Priority) => {
    updateTaskPriority(taskId, suggestedPriority);
  };
  
  const handleDismissSuggestion = (taskId: string) => {
    // This would typically update state to hide the suggestion,
    // for now, it just calls updateTaskPriority with current priority (no change)
    // A more robust solution would involve managing suggested tasks state separately.
    const task = tasks.find(t => t.id === taskId);
    if (task) updateTaskPriority(taskId, task.priority);
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>AI Task Prioritization</CardTitle>
              <CardDescription>Let AI suggest priorities for your tasks based on deadlines and impact. You can then apply or override these suggestions.</CardDescription>
            </div>
            <Button onClick={suggestTaskPrioritization} disabled={isLoadingAi || tasks.length === 0}>
              <Wand2 className="mr-2 h-5 w-5" />
              {isLoadingAi ? "Analyzing..." : (tasks.length === 0 ? "No tasks to analyze" : "Suggest Priorities")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAi && (
            <div className="text-center py-8">
              <Wand2 className="h-10 w-10 animate-pulse text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">AI is analyzing your tasks...</p>
            </div>
          )}

          {!isLoadingAi && prioritizedSuggestions.length === 0 && (
             <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>No Suggestions Yet</AlertTitle>
              <AlertDescription>
                Click "Suggest Priorities" to get AI-powered recommendations for your tasks. 
                If you have no tasks, please add some first on the Tasks page.
              </AlertDescription>
            </Alert>
          )}

          {!isLoadingAi && prioritizedSuggestions.length > 0 && (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Current Priority</TableHead>
                    <TableHead>Suggested Priority</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioritizedSuggestions.map((suggestion) => (
                    <TableRow key={suggestion.taskId}>
                      <TableCell className="font-medium max-w-xs truncate" title={suggestion.title}>{suggestion.title}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(suggestion.currentPriority)}>
                          {suggestion.currentPriority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(suggestion.suggestedPriority)}>
                          {suggestion.suggestedPriority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-sm truncate" title={suggestion.reason}>{suggestion.reason}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleApplySuggestion(suggestion.taskId, suggestion.suggestedPriority)}
                          className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                          aria-label={`Apply suggestion for ${suggestion.title}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                         <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDismissSuggestion(suggestion.taskId)}
                          className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Dismiss suggestion for ${suggestion.title}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Task Priorities</CardTitle>
          <CardDescription>View all tasks and manually adjust their priorities if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">No tasks available. Add tasks on the Tasks page.</p>
          ) : (
            <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Current Priority</TableHead>
                  <TableHead className="w-[200px]">Set New Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium max-w-md truncate" title={task.title}>{task.title}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={task.priority} 
                        onValueChange={(newPriority) => updateTaskPriority(task.id, newPriority as Priority)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Set priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
