"use client";

import dynamic from "next/dynamic";
import React from "react";

const ReportsChartClient = dynamic(() => import("./ReportsChartClient"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] flex items-center justify-center text-sm text-zinc-400">Loading chart…</div>
  ),
});

export default function ReportsChartWrapper(props: any) {
  return <ReportsChartClient {...props} />;
}
