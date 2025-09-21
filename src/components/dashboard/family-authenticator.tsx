import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ShieldCheck, ShieldAlert, KeyRound, HelpCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

const securityQuestions = [
  { question: "What was the name of your first pet?", answer: "Buddy" },
  { question: "In what city did your parents meet?", answer: "San Diego" },
  { question: "What is your mother's maiden name?", answer: "Smith" },
  { question: "What was the model of your first car?", answer: "Honda Civic" },
  { question: "What is your favorite childhood book?", answer: "The Giving Tree" },
];

type VerificationStatus = "idle" | "success" | "fail";

export function FamilyAuthenticator({ name = "Family Authenticator" }: { name?: string }) {
  const [generatedCode, setGeneratedCode] = useState("");
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);

  const generateNewCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
  };

  useEffect(() => {
    generateNewCode();
    setCurrentQuestionIndex(Math.floor(Math.random() * securityQuestions.length));
  }, []);

  const handleVerifyCode = () => {
    // Local verification against the generated code (UI-side demo).
    if (verificationInput === generatedCode && generatedCode !== "") {
      setVerificationStatus("success");
    } else {
      setVerificationStatus("fail");
    }
  };

  const getNextQuestion = () => {
    setIsAnswerVisible(false);
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % securityQuestions.length);
  };
  
  const statusIcons: Record<VerificationStatus, React.ReactNode> = {
    idle: <KeyRound className="w-12 h-12 text-muted-foreground" />,
    success: <ShieldCheck className="w-12 h-12 text-green-500" />,
    fail: <ShieldAlert className="w-12 h-12 text-destructive" />,
  };
  
  const statusMessages: Record<VerificationStatus, { text: string, className: string }> = {
    idle: { text: "Enter the 6-digit code to verify.", className: "text-muted-foreground" },
    success: { text: "Verification Successful! Identity confirmed.", className: "text-green-500 font-semibold" },
    fail: { text: "Verification Failed. Code is incorrect.", className: "text-destructive font-semibold" },
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Verify the identity of a family member.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs defaultValue="verify" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verify">Verify Code</TabsTrigger>
            <TabsTrigger value="get">Get Code</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="verify" className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
            {statusIcons[verificationStatus]}
            <p className={cn("text-sm h-10", statusMessages[verificationStatus].className)}>
              {statusMessages[verificationStatus].text}
            </p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="text"
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                value={verificationInput}
                onChange={(e) => {
                  setVerificationInput(e.target.value);
                  setVerificationStatus("idle");
                }}
                className="text-center text-2xl font-mono tracking-widest h-14"
              />
              <Button onClick={handleVerifyCode}>Verify</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="get" className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
            <KeyRound className="w-12 h-12 text-primary" />
            <p className="text-muted-foreground">Share this code with your family member.</p>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-5xl font-mono tracking-widest text-primary">{generatedCode}</p>
            </div>
            <Button onClick={generateNewCode} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2"/>
              Generate New Code
            </Button>
          </TabsContent>
          
          <TabsContent value="questions" className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
            <HelpCircle className="w-12 h-12 text-primary" />
            <p className="text-muted-foreground">Ask the person this question to verify them.</p>
            <Card className="w-full max-w-sm p-4">
              <p className="font-semibold">{securityQuestions[currentQuestionIndex].question}</p>
              {isAnswerVisible && (
                 <p className="text-lg text-primary font-bold mt-2 animate-in fade-in">
                    {securityQuestions[currentQuestionIndex].answer}
                </p>
              )}
            </Card>
            <div className="flex gap-2">
                 <Button onClick={() => setIsAnswerVisible(!isAnswerVisible)} variant="secondary">
                    {isAnswerVisible ? <EyeOff className="w-4 h-4 mr-2"/> : <Eye className="w-4 h-4 mr-2"/>}
                    {isAnswerVisible ? "Hide Answer" : "Show Answer"}
                </Button>
                <Button onClick={getNextQuestion} variant="outline">
                    Next Question
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
