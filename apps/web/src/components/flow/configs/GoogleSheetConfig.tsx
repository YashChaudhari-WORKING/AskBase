"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { GoogleSheetData } from "../types";
import { FormField, FieldInput } from "./FormField";

const APPS_SCRIPT = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data  = JSON.parse(e.postData.contents);
  var keys  = Object.keys(data);

  // Auto-create header columns for any new fields
  var lastCol = sheet.getLastColumn();
  var headers = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    : [];

  keys.forEach(function(k) {
    if (headers.indexOf(k) === -1) {
      headers.push(k);
      sheet.getRange(1, headers.length).setValue(k);
    }
  });

  // Append data row in header order
  var row = headers.map(function(h) {
    return data[h] !== undefined ? data[h] : "";
  });
  sheet.appendRow(row);

  return ContentService
    .createTextOutput("ok")
    .setMimeType(ContentService.MimeType.TEXT);
}`;

const STEPS = [
  "Open your Google Sheet → Extensions → Apps Script",
  'Delete any existing code and paste the script below, then click Save (💾)',
  "Click Deploy → New deployment → Select type: Web App",
  'Set "Execute as" = Me, "Who has access" = Anyone → Deploy',
  "Click Authorize → Advanced → Go to (unsafe) → Allow",
  "Copy the Web App URL and paste it below",
];

interface Props {
  data: GoogleSheetData;
  onChange: (data: GoogleSheetData) => void;
}

export function GoogleSheetConfig({ data, onChange }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(!data.webAppUrl);

  function copyScript() {
    navigator.clipboard.writeText(APPS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Setup guide */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <span className="text-xs font-semibold text-foreground">Setup guide (60 seconds)</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>

        {open && (
          <div className="px-3 py-3 space-y-3 border-t border-border">
            <ol className="space-y-1.5">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            {/* Script block */}
            <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50">
                <span className="text-[10px] font-mono text-muted-foreground">Apps Script</span>
                <button
                  onClick={copyScript}
                  className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground overflow-x-auto leading-relaxed whitespace-pre">
                {APPS_SCRIPT}
              </pre>
            </div>

            <div className="px-2.5 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                <strong>No re-deploy needed.</strong> The script auto-creates columns for any new fields you add to your flow. Paste the URL once and you're done.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* URL input */}
      <FormField label="Web App URL">
        <FieldInput
          type="url"
          value={data.webAppUrl}
          onChange={v => onChange({ ...data, webAppUrl: v })}
          placeholder="https://script.google.com/macros/s/.../exec"
        />
        <p className="text-[10px] text-muted-foreground/50 mt-1">
          All collected lead fields are sent as JSON and appended as a new row.
        </p>
      </FormField>
    </div>
  );
}
