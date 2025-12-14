import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Settings, Play, Pause, Edit, Trash2, Zap, Bell, Mail, Calendar, AlertTriangle, Loader2, Brain, X } from "lucide-react";
import api from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const mockWorkflowRules = [
  {
    id: "WF-001",
    name: "Low Stock Alert",
    description: "Send email when inventory falls below minimum level",
    trigger: "Inventory Level < 10",
    action: "Send Email Alert",
    status: "active",
    lastTriggered: "2 hours ago"
  },
  {
    id: "WF-002",
    name: "Auto Reorder",
    description: "Automatically create purchase orders for low stock items",
    trigger: "Stock Level < Reorder Point",
    action: "Create Purchase Order",
    status: "active",
    lastTriggered: "1 day ago"
  },
  {
    id: "WF-003",
    name: "Price Change Notification",
    description: "Notify team when product prices are updated",
    trigger: "Price Modified",
    action: "Send Team Notification",
    status: "inactive",
    lastTriggered: "Never"
  }
];

const mockAlerts = [
  {
    id: "ALT-001",
    title: "Critical Stock Level",
    description: "Laptop Pro inventory below critical threshold",
    type: "critical",
    time: "5 minutes ago",
    status: "unread"
  },
  {
    id: "ALT-002",
    title: "Purchase Order Approved",
    description: "PO-001 has been approved and sent to vendor",
    type: "info",
    time: "1 hour ago",
    status: "read"
  },
  {
    id: "ALT-003",
    title: "Vendor Payment Due",
    description: "Payment to Tech Supplies Inc due in 3 days",
    type: "warning",
    time: "3 hours ago",
    status: "unread"
  }
];

export default function Automation() {
  const [report, setReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { toast } = useToast();

  const generateAIReport = async () => {
    setLoadingReport(true);
    try {
      const res = await api.get('api/inventory-report/');
      setReport(res.data);
      setIsReportOpen(true); // Open dialog with report
      toast({ title: 'Success', description: 'AI Inventory Report Generated!' });
    } catch (err: any) {
      console.error('Report Error:', err);
      toast({ title: 'Error', description: 'Failed to generate report.', variant: 'destructive' });
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automation & Workflows</h1>
          <p className="text-muted-foreground">Automate your inventory processes and set up intelligent alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateAIReport} disabled={loadingReport}>
            {loadingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
            Generate AI Report
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Workflow
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Running automatically</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Actions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Report Dialog (Popup) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Inventory Behavior Report
            </DialogTitle>
            <DialogDescription>
              Generated by Gemini AI based on current inventory data.
            </DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p className="text-muted-foreground">{report.summary}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Risk Level</h3>
                  <Badge variant={report.risk_level === 'high' ? 'destructive' : report.risk_level === 'medium' ? 'secondary' : 'default'}>
                    {report.risk_level.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Key Trends</h3>
                <p className="text-muted-foreground">{report.trends}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Reorder Recommendations</h3>
                <div className="space-y-2">
                  {report.reorder_recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <div className="font-medium">ID: {rec.product_id}</div>
                        <div className="text-sm text-muted-foreground">Suggested Qty: {rec.suggested_qty}</div>
                      </div>
                      <Badge variant={rec.urgency === 'high' ? 'destructive' : 'secondary'}>
                        {rec.urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Action Items</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {report.action_items.map((action: string, i: number) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>
              Close
            </Button>
            <Button onClick={generateAIReport}>
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Tabs */}
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="workflows">Workflow Rules</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Triggered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWorkflowRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">{rule.description}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{rule.trigger}</TableCell>
                      <TableCell className="text-sm">{rule.action}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch checked={rule.status === 'active'} />
                          <span className={`text-xs ${
                            rule.status === 'active' ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            {rule.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{rule.lastTriggered}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <Card key={alert.id} className={`${
                alert.status === 'unread' ? 'border-primary' : 'border-border'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 ${
                      alert.type === 'critical' ? 'text-red-500' :
                      alert.type === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {alert.type === 'critical' ? <AlertTriangle className="h-5 w-5" /> :
                       alert.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
                       <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{alert.title}</h3>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      {alert.status === 'unread' && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm">Mark as Read</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Pre-configured rules for stock level monitoring and alerts
                </p>
                <Button variant="outline" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auto Reordering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automatically create purchase orders when stock is low
                </p>
                <Button variant="outline" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendor Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Automate vendor communications and payment reminders
                </p>
                <Button variant="outline" className="w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <span className="font-medium">Low Stock Alert</span> triggered for <span className="font-medium">Laptop Pro</span>
                  </div>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <span className="font-medium">Auto Reorder</span> created <span className="font-medium">PO-004</span>
                  </div>
                  <span className="text-muted-foreground">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <span className="font-medium">Payment Reminder</span> sent to <span className="font-medium">Tech Supplies Inc</span>
                  </div>
                  <span className="text-muted-foreground">2 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
console.log("Automation page Loaded")