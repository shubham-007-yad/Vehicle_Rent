"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function DbErrorCard() {
  return (
    <div className="h-[70vh] flex items-center justify-center">
      <Card className="max-w-md w-full border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <CardTitle className="text-red-700 dark:text-red-400">Database Connection Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-300">
            Could not connect to MongoDB Atlas. This is likely due to your IP address not being whitelisted.
          </p>
          <div className="bg-background/50 p-4 rounded-lg text-left text-xs space-y-2 border border-red-100 dark:border-red-900">
            <p className="font-bold uppercase tracking-widest text-[10px]">How to fix:</p>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Go to <strong>MongoDB Atlas Dashboard</strong></li>
              <li>Navigate to <strong>Network Access</strong></li>
              <li>Click <strong>Add IP Address</strong> &gt; <strong>Add Current IP</strong></li>
              <li>Wait 1-2 minutes for the change to deploy</li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
