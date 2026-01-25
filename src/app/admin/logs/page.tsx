'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeBracketIcon, CommandLineIcon } from '@heroicons/react/24/outline'

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Application Logs
        </h1>
        <p className="text-muted-foreground mt-2">
          View application logs using Docker commands
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CommandLineIcon className="h-5 w-5" />
            Viewing Logs
          </CardTitle>
          <CardDescription>
            Since FauxDash runs in a Docker container, logs must be viewed using Docker CLI commands from your host machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">View Recent Logs</h3>
            <div className="bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg">
              <code>docker compose logs app --tail=100</code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Shows the last 100 lines of logs from the FauxDash container
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Follow Logs in Realtime</h3>
            <div className="bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg">
              <code>docker compose logs -f app</code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Streams logs in realtime as they are generated (press Ctrl+C to stop)
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">View Logs with Timestamps</h3>
            <div className="bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg">
              <code>docker compose logs -f --timestamps app</code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Includes timestamps with each log entry
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">View Specific Number of Lines</h3>
            <div className="bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-lg">
              <code>docker compose logs app --tail=500</code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Adjust the number to see more or fewer log lines
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CodeBracketIcon className="h-5 w-5" />
            Common Issues to Look For
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-red-500 font-mono">Error:</span>
              <span>Application errors and exceptions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-yellow-500 font-mono">Warning:</span>
              <span>Potential issues that may need attention</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-500 font-mono">Info:</span>
              <span>General application information</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-500 font-mono">✓ Ready:</span>
              <span>Application successfully started</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <p className="font-medium mb-1">Why can&apos;t I view logs in the web interface?</p>
        <p>
          The FauxDash application runs inside a Docker container. To access Docker logs from within the container
          would require mounting the Docker socket, which poses security risks. Using the Docker CLI from your
          host machine is the recommended approach for viewing container logs.
        </p>
      </div>
    </div>
  )
}
