"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  href: string;
  label?: string;
}

export function ExportButton({ href, label = "Export CSV" }: ExportButtonProps) {
  return (
    <Link href={href} download>
      <Button type="button" variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}
