import React, { useEffect, useRef, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { generateReactComponent } from "../../services/ai";
import { Wand2, Loader2, Code } from "lucide-react";

const makeSrcDoc = (userCode: string) => {
  const safe = (userCode || "").replaceAll("</script>", "<\\/script>");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html,body{height:100%;margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;background:transparent;color:inherit}
      .wrap{height:100%;padding:16px;box-sizing:border-box}
      .cell{height:100%;overflow:auto;}
      pre.err{color:#ffb4b4;padding:12px;margin:0;white-space:pre-wrap}
    </style>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  </head>
  <body>
    <div id="anchor-center" class="cell"></div>
    <script>
      (function(){
        function showError(msg){
          try{
            var n = document.getElementById('anchor-center');
            if(!n) return;
            n.innerHTML = '';
            var pre = document.createElement('pre'); pre.className='err';
            pre.textContent = 'Canvas error: ' + msg; n.appendChild(pre);
          }catch(e){}
        }
        window.addEventListener('error', function(e){ showError(e.error?.message || e.message || String(e)); });
        window.addEventListener('unhandledrejection', function(e){ showError(e.reason?.message || String(e.reason)); });
        window.FrameAPI = {
          render: function(registry){
            try{
              var node = document.getElementById('anchor-center');
              if(!node) return;
              var el = registry && registry.center; if(el==null) return;
              var root = node.__root || (node.__root = ReactDOM.createRoot(node));
              root.render(el);
            }catch(err){ showError(err && err.message ? err.message : String(err)); }
          }
        };
      })();
    </script>
    <script>
${safe}
    </script>
  </body>
</html>`;
};

export function DreamWeaver({ name = "Dream Weaver" }: { name?: string }) {
  const [prompt, setPrompt] = useState<string>(
    "a simple counter with start/stop/reset buttons and a big number."
  );
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const applyToIframe = (js: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = makeSrcDoc(js);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please describe the component you want to create.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      setStatus("Generating component...");
      setError("");
      setCode("");
      try {
        // generateReactComponent is implemented in renderer/services/ai.ts
        // which should call Electron IPC/preload to run the model in the main process.
        const result = await generateReactComponent({ description: prompt });
        const cleanedCode = result.componentCode
          .replace(/^