"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCheck, Printer, Download, GraduationCap } from "lucide-react";

export default function CertificatesPage() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [certType, setCertType] = useState("Transfer Certificate");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Certificates & Document Generator</h1>
          <p className="text-xs text-muted-foreground">Generate and print Transfer Certificates (TC), Bonafide & Character Certificates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:border-blue-500 cursor-pointer" onClick={() => { setCertType("Transfer Certificate (TC)"); setIsPreviewOpen(true); }}>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <span>Transfer Certificate (TC)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Generate official school leaving Transfer Certificate with CBSE serial code & principal stamp.
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500 cursor-pointer" onClick={() => { setCertType("Bonafide Student Certificate"); setIsPreviewOpen(true); }}>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <span>Bonafide Certificate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Generate Bonafide student proof certificate for passport, bus pass & bank account opening.
          </CardContent>
        </Card>

        <Card className="hover:border-blue-500 cursor-pointer" onClick={() => { setCertType("Character & Conduct Certificate"); setIsPreviewOpen(true); }}>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-purple-600" />
              <span>Character Certificate</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Generate student conduct & character certificate signed by class teacher & headmaster.
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between">
            <span>{certType} Preview</span>
            <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Certificate
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div id="printable-area" className="p-8 bg-white text-slate-900 border-4 border-double border-blue-900 rounded-lg space-y-6 text-center font-serif">
          <div className="space-y-1">
            <GraduationCap className="h-10 w-10 text-blue-900 mx-auto" />
            <h1 className="text-2xl font-bold uppercase tracking-widest text-blue-900">PrismaEd+ School</h1>
            <p className="text-xs font-sans text-slate-600">Affiliated to CBSE Delhi • School Code: 54109</p>
            <h2 className="text-lg font-bold underline uppercase tracking-wider text-slate-800 pt-4">{certType}</h2>
          </div>

          <div className="text-sm leading-relaxed text-justify px-6 py-4 font-sans space-y-4">
            <p>
              This is to certify that <strong>Aarav Sharma</strong>, Son of Shri <strong>Rajesh Sharma</strong>, resident of 42, Vasant Vihar, New Delhi, is a bonafide student of this institution studying in <strong>Grade 10 - Section A</strong> during the academic session <strong>2026-2027</strong>.
            </p>
            <p>
              His Date of Birth as per official school register is <strong>15th April 2010</strong>. He bears a good moral character and has shown exemplary academic conduct.
            </p>
          </div>

          <div className="pt-12 grid grid-cols-2 gap-8 text-xs font-sans">
            <div className="text-left">
              <p>Date of Issue: August 07, 2026</p>
              <p>Certificate Serial No: CERT-2026-889</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed mb-1" />
              <p className="font-bold">Principal Signature & School Seal</p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
