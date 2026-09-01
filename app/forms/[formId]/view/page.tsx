"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type QuestionType = 
  | "Short answer" 
  | "Paragraph" 
  | "Multiple choice" 
  | "Checkboxes" 
  | "Dropdown" 
  | "Linear scale" 
  | "Date" 
  | "Time" 
  | "File upload";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  form_id?: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: Option[];
  order: number;
}

interface FormSchema {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  accepting_responses?: boolean;
  limit_one_response?: boolean;
  confirmation_message?: string;
  show_progress_bar?: boolean;
  shuffle_questions?: boolean;
  theme_color?: string;
  background_color?: string;
  font_family?: string;
}

export default function FormViewer() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<FormSchema | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formSnap, qSnap] = await Promise.all([
          getDoc(doc(db, "forms", formId)),
          getDocs(query(collection(db, "questions"), where("form_id", "==", formId)))
        ]);
        
        if (!formSnap.exists()) {
          setError("Form not found.");
          setLoading(false);
          return;
        }
        setForm({ id: formSnap.id, ...formSnap.data() } as FormSchema);

        let qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        qList.sort((a, b) => a.order - b.order);
        
        // Apply shuffle if setting is true
        if (formSnap.data()?.shuffle_questions) {
          qList = qList.sort(() => Math.random() - 0.5);
        }
        
        setQuestions(qList);
      } catch (err) {
        console.error(err);
        setError("Failed to load form.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [formId]);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId: string, optionId: string, checked: boolean) => {
    setResponses(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] };
      } else {
        return { ...prev, [questionId]: current.filter((id: string) => id !== optionId) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields: string[] = [];
    for (const q of questions) {
      if (q.required) {
        const val = responses[q.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          missingFields.push(q.title);
        }
      }
    }

    if (missingFields.length > 0) {
      toast.error(`Please answer all required questions.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "responses"), {
        form_id: formId,
        answers: responses,
        submitted_at: new Date().toISOString()
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Form could not be loaded."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customStyle = {
    "--primary": form.theme_color || "262.1 83.3% 57.8%",
    "backgroundColor": form.background_color || "var(--background)",
    "fontFamily": form.font_family === 'Playful' ? 'Comic Sans MS, cursive' : form.font_family === 'Formal' ? 'Georgia, serif' : 'inherit'
  } as React.CSSProperties;

  if (form.accepting_responses === false) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-8" style={customStyle}>
        <Card className="w-full max-w-2xl border-t-8 border-t-primary shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-3xl font-normal">{form.title}</CardTitle>
            <CardDescription className="text-base mt-4">
              This form is no longer accepting responses.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center p-4 sm:p-8" style={customStyle}>
        <Card className="w-full max-w-2xl border-t-8 border-t-primary shadow-sm bg-card text-center py-12">
          <CardHeader className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-3xl font-normal">{form.title}</CardTitle>
            <CardDescription className="text-lg mt-4 text-foreground">
              {form.confirmation_message || "Your response has been recorded."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center mt-8">
            <Button variant="outline" onClick={() => window.location.reload()}>Submit another response</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 pb-32" style={customStyle}>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
        
        <Card className="border-t-8 border-t-primary shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-3xl font-normal">{form.title}</CardTitle>
            {form.description && <CardDescription className="text-base whitespace-pre-wrap mt-2 text-foreground/80">{form.description}</CardDescription>}
            <p className="text-destructive text-sm mt-4">* Indicates required question</p>
          </CardHeader>
        </Card>

        {questions.map((q) => (
          <Card key={q.id} className={`shadow-sm bg-card ${q.required && (responses[q.id] === undefined || responses[q.id] === "" || (Array.isArray(responses[q.id]) && responses[q.id].length === 0)) ? 'border-border' : ''}`}>
            <CardContent className="p-6">
              <Label className="text-base font-medium mb-4 block">
                {q.title} {q.required && <span className="text-destructive">*</span>}
              </Label>

              <div className="mt-4">
                {q.type === "Short answer" && (
                  <Input 
                    type="text" 
                    placeholder="Your answer"
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    className="border-0 border-b rounded-none shadow-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary px-0 bg-transparent w-1/2 min-w-[200px]"
                  />
                )}

                {q.type === "Paragraph" && (
                  <Textarea 
                    placeholder="Your answer"
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    className="border-0 border-b rounded-none shadow-none focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary px-0 bg-transparent resize-y min-h-[100px]"
                  />
                )}

                {q.type === "Multiple choice" && q.options && (
                  <RadioGroup value={responses[q.id]} onValueChange={(val) => handleResponseChange(q.id, val)} className="space-y-3">
                    {q.options.map(opt => (
                      <div key={opt.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={opt.id} id={`radio-${opt.id}`} />
                        <Label htmlFor={`radio-${opt.id}`} className="font-normal text-base cursor-pointer leading-tight">{opt.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.type === "Checkboxes" && q.options && (
                  <div className="space-y-3">
                    {q.options.map(opt => (
                      <div key={opt.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`check-${opt.id}`}
                          checked={(responses[q.id] || []).includes(opt.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(q.id, opt.id, !!checked)}
                        />
                        <Label htmlFor={`check-${opt.id}`} className="font-normal text-base cursor-pointer leading-tight">{opt.text}</Label>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === "Dropdown" && q.options && (
                  <Select value={responses[q.id]} onValueChange={(val) => handleResponseChange(q.id, val)}>
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {q.type === "Linear scale" && (
                  <RadioGroup 
                    value={responses[q.id]?.toString()} 
                    onValueChange={(val) => handleResponseChange(q.id, parseInt(val))} 
                    className="flex flex-row justify-between sm:justify-start sm:gap-8 pt-4"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <div key={num} className="flex flex-col items-center gap-2">
                        <Label htmlFor={`scale-${q.id}-${num}`} className="font-normal">{num}</Label>
                        <RadioGroupItem value={num.toString()} id={`scale-${q.id}-${num}`} />
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.type === "Date" && (
                  <Input 
                    type="date" 
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    className="w-full sm:w-[200px]"
                  />
                )}

                {q.type === "Time" && (
                  <Input 
                    type="time" 
                    value={responses[q.id] || ""}
                    onChange={(e) => handleResponseChange(q.id, e.target.value)}
                    className="w-full sm:w-[200px]"
                  />
                )}

                {q.type === "File upload" && (
                  <div className="p-4 border-2 border-dashed rounded-md text-center text-muted-foreground bg-muted/20">
                    File upload is not supported in this demo yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-between items-center pt-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="px-8">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit"}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost"
            onClick={() => setResponses({})}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            Clear form
          </Button>
        </div>
      </form>

      {/* RGUKT Forms Branding Footer */}
      <div className="mt-12 text-center text-xs text-muted-foreground w-full max-w-2xl flex flex-col items-center gap-2">
        <p>Never submit passwords through RGUKT Forms.</p>
        <div className="flex items-center gap-1.5 justify-center mt-2 opacity-70 hover:opacity-100 transition-opacity cursor-default">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold">R</div>
          <span className="font-semibold text-sm tracking-tight text-foreground/80">RGUKT Forms</span>
        </div>
      </div>
    </div>
  );
}
