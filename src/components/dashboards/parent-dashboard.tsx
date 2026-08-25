import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/enterprise/metric-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DUMMY_ANNOUNCEMENTS, DUMMY_FEE_INVOICES } from "@/lib/dummy-data";
import { UserCheck, CreditCard, Award, Megaphone, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState("Aarav Sharma");

  return (
    <div className="space-y-6">
      {/* Child Switcher Banner */}
      <div className="p-4 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-400">Parent Portal Overview</span>
          <h2 className="text-base font-bold">Child Progress Dashboard</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-300">Active Child:</span>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="h-8 rounded border border-slate-700 bg-slate-800 px-3 text-xs text-white focus:outline-none"
          >
            <option value="Aarav Sharma">Aarav Sharma (Grade 10-A)</option>
            <option value="Diya Sharma">Diya Sharma (Grade 6-B)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Child Attendance Rate"
          value="96.5%"
          change="Very Good"
          trend="up"
          subtitle="No unexcused absences"
          icon={UserCheck}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="Latest Academic Rank"
          value="Rank #2"
          change="Unit Test 1"
          trend="up"
          subtitle="Class 10-A"
          icon={Award}
          iconBg="bg-purple-50 text-purple-600"
        />
        <MetricCard
          title="Term 1 Fee Status"
          value="Paid"
          change="₹ 45,000"
          trend="up"
          subtitle="All dues cleared"
          icon={CreditCard}
          iconBg="bg-teal-50 text-teal-600"
        />
        <MetricCard
          title="Teacher Feedback"
          value="Excellent"
          change="Sunita Deshmukh"
          trend="neutral"
          subtitle="Attentive in mathematics"
          icon={CheckCircle}
          iconBg="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>Fee Payment Ledger</span>
              <Link to="/fees">
                <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700">Pay Online / Receipts</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_FEE_INVOICES.slice(0, 2).map((inv) => (
              <div key={inv.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{inv.term}</p>
                  <p className="text-muted-foreground">{inv.invoiceNo} • Due {inv.dueDate}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">{formatCurrency(inv.totalAmount)}</span>
                  <p className="text-[10px] text-slate-400 font-semibold">{inv.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>School Circulars & Announcements</span>
              <Megaphone className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {DUMMY_ANNOUNCEMENTS.map((ann) => (
              <div key={ann.id} className="p-3 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{ann.title}</span>
                  <span className="text-[10px] text-slate-400">{ann.publishedDate}</span>
                </div>
                <p className="text-muted-foreground">{ann.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
