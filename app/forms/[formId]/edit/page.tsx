"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  Palette, Eye, MoreVertical, PlusCircle, Type, Layers, 
  ChevronUp, ChevronDown, Copy, Trash2, GripVertical, X,
  CheckCircle2, Loader2, ArrowLeft, Send
} from 'lucide-react';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, writeBatch, collection, getDocs, query, where, setDoc, deleteDoc, orderBy } from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// --- Types ---
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
  created_at?: string;
  accepting_responses?: boolean;
  limit_one_response?: boolean;
  allow_response_editing?: boolean;
  confirmation_message?: string;
  show_progress_bar?: boolean;
  shuffle_questions?: boolean;
  access_level?: "public" | "rgukt_only" | "restricted";
  theme_color?: string;
  background_color?: string;
  font_family?: string;
}

export default function FormEditor() {
  const params = useParams();
  const formId = params.formId as string;
  const router = useRouter();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "idle">("idle");
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Load Form Data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const formSnap = await getDoc(doc(db, "forms", formId));
        if (formSnap.exists()) {
          setForm({ id: formSnap.id, ...formSnap.data() } as FormSchema);
        } else {
          toast.error("Form not found");
          router.push("/");
          return;
        }

        const qSnap = await getDocs(query(collection(db, "questions"), where("form_id", "==", formId)));
        const qList = qSnap.docs.map(d => ({ id: d.id, ...d.data() } as Question));
        qList.sort((a, b) => a.order - b.order);
        
        if (qList.length > 0) {
          setQuestions(qList);
          setActiveQuestionId(qList[0].id);
        } else {
          // Auto create first question if empty
          const newQ: Question = {
            id: crypto.randomUUID(),
            form_id: formId,
            title: "Untitled Question",
            type: "Multiple choice",
            required: false,
            options: [{ id: crypto.randomUUID(), text: "Option 1" }],
            order: 0
          };
          setQuestions([newQ]);
          setActiveQuestionId(newQ.id);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      } finally {
        setLoading(false);
        isInitialLoad.current = false;
      }
    };
    
    fetchData();
  }, [formId, router]);

  // Load responses when tab is active
  useEffect(() => {
    if (activeTab === "responses") {
      const fetchResponses = async () => {
        setLoadingResponses(true);
        try {
          const resSnap = await getDocs(query(collection(db, "responses"), where("form_id", "==", formId)));
          const resList: any[] = [];
          resSnap.forEach(d => {
            resList.push({ id: d.id, ...d.data() });
          });
          // Sort client-side to avoid requiring a Firebase composite index
          resList.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
          setFormResponses(resList);
        } catch (err) {
          console.error("Error fetching responses:", err);
          toast.error("Failed to load responses");
        } finally {
          setLoadingResponses(false);
        }
      };
      fetchResponses();
    }
  }, [activeTab, formId]);

  // Autosave to Firestore
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    if (!form) return;
    
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const batch = writeBatch(db);
        
        // Update form metadata
        const formRef = doc(db, "forms", form.id);
        const formUpdateData: any = { ...form };
        delete formUpdateData.id;
        
        Object.keys(formUpdateData).forEach(key => {
          if (formUpdateData[key] === undefined) {
             formUpdateData[key] = null;
          }
        });
        
        batch.update(formRef, formUpdateData);

        // Save questions
        const qSnap = await getDocs(query(collection(db, "questions"), where("form_id", "==", form.id)));
        const currentIds = new Set(questions.map(q => q.id));
        
        qSnap.docs.forEach(d => {
          if (!currentIds.has(d.id)) {
            batch.delete(d.ref);
          }
        });

        questions.forEach(q => {
          const qRef = doc(db, "questions", q.id);
          const qData: any = { ...q, form_id: form.id };
          delete qData.id;
          
          if (qData.options === undefined) qData.options = null;
          batch.set(qRef, qData, { merge: true });
        });

        await batch.commit();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Autosave failed:", error);
        setSaveStatus("error");
      }
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [form, questions]);

  const updateFormHeader = (key: keyof FormSchema, value: string) => {
    if (form) setForm({ ...form, [key]: value });
  };

  const updateSetting = (key: keyof FormSchema, value: any) => {
    if (form) setForm({ ...form, [key]: value });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        const updated = { ...q, ...updates };
        if (updates.type && !updates.options && ["Multiple choice", "Checkboxes", "Dropdown"].includes(updates.type)) {
          updated.options = [{ id: crypto.randomUUID(), text: "Option 1" }];
        }
        return updated;
      }
      return q;
    }));
  };

  const addQuestion = () => {
    const newId = crypto.randomUUID();
    const newQ: Question = {
      id: newId,
      form_id: formId,
      title: "",
      type: "Multiple choice",
      required: false,
      options: [{ id: crypto.randomUUID(), text: "Option 1" }],
      order: questions.length
    };
    
    const insertIdx = questions.findIndex(q => q.id === activeQuestionId);
    const updated = [...questions];
    if (insertIdx !== -1) {
      updated.splice(insertIdx + 1, 0, newQ);
    } else {
      updated.push(newQ);
    }
    
    const reordered = updated.map((q, idx) => ({ ...q, order: idx }));
    setQuestions(reordered);
    setActiveQuestionId(newId);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast("You must have at least one question.");
      return;
    }
    const updated = questions.filter(q => q.id !== id);
    const reordered = updated.map((q, idx) => ({ ...q, order: idx }));
    setQuestions(reordered);
    if (activeQuestionId === id) setActiveQuestionId(null);
  };

  const duplicateQuestion = (id: string) => {
    const qToDup = questions.find(q => q.id === id);
    if (!qToDup) return;
    
    const newId = crypto.randomUUID();
    const newQ = { 
      ...qToDup, 
      id: newId, 
      options: qToDup.options ? qToDup.options.map(o => ({ ...o, id: crypto.randomUUID() })) : undefined
    };
    
    const idx = questions.findIndex(q => q.id === id);
    const updated = [...questions];
    updated.splice(idx + 1, 0, newQ);
    
    const reordered = updated.map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);
    setActiveQuestionId(newId);
  };

  const deleteResponse = async (responseId: string) => {
    if (!window.confirm("Are you sure you want to delete this response? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, "responses", responseId));
      setFormResponses(prev => prev.filter(r => r.id !== responseId));
      toast.success("Response deleted");
    } catch (err) {
      console.error("Error deleting response:", err);
      toast.error("Failed to delete response");
    }
  };

  if (loading || !form) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const customStyle = {
    "--primary": form.theme_color || "262.1 83.3% 57.8%",
    "backgroundColor": form.background_color || "var(--background)",
    "fontFamily": form.font_family === 'Playful' ? 'Comic Sans MS, cursive' : form.font_family === 'Formal' ? 'Georgia, serif' : 'inherit'
  } as React.CSSProperties;

  return (
    <div className="min-h-screen flex flex-col" style={customStyle}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input 
              value={form.title}
              onChange={(e) => updateFormHeader("title", e.target.value)}
              className="text-lg font-medium border-transparent shadow-none bg-transparent hover:border-border focus-visible:ring-0 w-48 sm:w-64"
            />
            {saveStatus === "saving" && <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>}
            {saveStatus === "saved" && <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Saved</span>}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setThemePanelOpen(true)} title="Customize Theme">
              <Palette className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.open(`/forms/${formId}/view`, '_blank')} title="Preview">
              <Eye className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button onClick={() => setSendModalOpen(true)} className="gap-2 hidden sm:flex">
              <Send className="h-4 w-4" /> Send
            </Button>
            <Button size="icon" onClick={() => setSendModalOpen(true)} className="sm:hidden">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center border-t bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl">
            <TabsList className="w-full justify-center rounded-none bg-transparent h-12 p-0 space-x-8">
              <TabsTrigger value="questions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent h-full px-4">
                Questions
              </TabsTrigger>
              <TabsTrigger value="responses" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent h-full px-4">
                Responses
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent h-full px-4">
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto p-4 sm:p-6 pb-32 ${activeTab === 'responses' ? 'max-w-7xl' : 'max-w-3xl'}`} onClick={() => setActiveQuestionId(null)}>
        {activeTab === 'questions' && (
          <div className="space-y-6 relative">
            {/* Form Header */}
            <Card className="border-t-8 border-t-primary" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="space-y-4">
                <Input 
                  value={form.title}
                  onChange={(e) => updateFormHeader("title", e.target.value)}
                  className="text-3xl font-normal h-14 border-x-0 border-t-0 border-b focus-visible:ring-0 px-0 rounded-none bg-transparent"
                  placeholder="Form Title"
                />
                <Textarea 
                  value={form.description || ""}
                  onChange={(e) => updateFormHeader("description", e.target.value)}
                  className="resize-none border-x-0 border-t-0 border-b focus-visible:ring-0 px-0 rounded-none bg-transparent"
                  placeholder="Form description"
                  rows={2}
                />
              </CardHeader>
            </Card>

            {/* Questions List */}
            {questions.map((q, idx) => (
              <div key={q.id} onClick={(e) => { e.stopPropagation(); setActiveQuestionId(q.id); }}>
                <QuestionCard 
                  question={q}
                  isActive={activeQuestionId === q.id}
                  updateQuestion={updateQuestion}
                  deleteQuestion={deleteQuestion}
                  duplicateQuestion={duplicateQuestion}
                />
              </div>
            ))}

            {/* Floating Action Menu (Desktop) */}
            <div className="hidden md:flex flex-col bg-background border rounded-xl shadow-sm fixed top-1/2 -translate-y-1/2 right-[calc(50%-420px)] p-2 gap-2">
              <Button variant="ghost" size="icon" onClick={addQuestion} title="Add question" className="rounded-full">
                <PlusCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Add title and description" className="rounded-full">
                <Type className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" title="Add section" className="rounded-full">
                <Layers className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Floating Action Menu (Mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-2 flex justify-around shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
              <Button variant="ghost" size="icon" onClick={addQuestion} title="Add question" className="rounded-full">
                <PlusCircle className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Type className="h-6 w-6" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Layers className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-2xl font-normal">{formResponses.length} {formResponses.length === 1 ? 'Response' : 'Responses'}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingResponses ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : formResponses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Waiting for responses. Share your form to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full border rounded-lg">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                        <tr>
                          <th className="px-4 py-3 border-b font-medium whitespace-nowrap">Timestamp</th>
                          {questions.map((q) => (
                            <th key={q.id} className="px-4 py-3 border-b border-l font-medium max-w-[200px] truncate" title={q.title}>
                              {q.title}
                            </th>
                          ))}
                          <th className="px-4 py-3 border-b border-l font-medium w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formResponses.map((res, idx) => (
                          <tr key={res.id} className="bg-card hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 border-b whitespace-nowrap text-muted-foreground">
                              {new Date(res.submitted_at).toLocaleString()}
                            </td>
                            {questions.map((q) => {
                              const val = res.answers[q.id];
                              let displayVal = "";
                              if (val !== undefined && val !== null && val !== "") {
                                if (["Multiple choice", "Dropdown"].includes(q.type) && q.options) {
                                  const opt = q.options.find(o => o.id === val);
                                  displayVal = opt ? opt.text : val.toString();
                                } else if (q.type === "Checkboxes" && Array.isArray(val) && q.options) {
                                  displayVal = val.map(vId => {
                                    const opt = q.options!.find(o => o.id === vId);
                                    return opt ? opt.text : vId;
                                  }).join(", ");
                                } else {
                                  displayVal = Array.isArray(val) ? val.join(", ") : val.toString();
                                }
                              }
                              return (
                                <td key={q.id} className="px-4 py-3 border-b border-l max-w-[300px] truncate" title={displayVal}>
                                  {displayVal || <span className="text-muted-foreground/30 italic">No answer</span>}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 border-b border-l text-center">
                              <Button variant="ghost" size="icon" onClick={() => deleteResponse(res.id)} title="Delete response" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Responses</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-medium">Accepting responses</h4>
                    <p className="text-sm text-muted-foreground">Turn this off to stop receiving responses</p>
                  </div>
                  <Checkbox 
                    checked={form.accepting_responses !== false} 
                    onCheckedChange={(c) => updateSetting("accepting_responses", !!c)} 
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-medium">Limit to 1 response</h4>
                  </div>
                  <Checkbox 
                    checked={form.limit_one_response || false} 
                    onCheckedChange={(c) => updateSetting("limit_one_response", !!c)} 
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-medium">Allow response editing</h4>
                  </div>
                  <Checkbox 
                    checked={form.allow_response_editing || false} 
                    onCheckedChange={(c) => updateSetting("allow_response_editing", !!c)} 
                    className="h-5 w-5"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Presentation</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-medium">Show progress bar</h4>
                  </div>
                  <Checkbox 
                    checked={form.show_progress_bar || false} 
                    onCheckedChange={(c) => updateSetting("show_progress_bar", !!c)} 
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-medium">Shuffle question order</h4>
                  </div>
                  <Checkbox 
                    checked={form.shuffle_questions || false} 
                    onCheckedChange={(c) => updateSetting("shuffle_questions", !!c)} 
                    className="h-5 w-5"
                  />
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h4 className="font-medium">Confirmation message</h4>
                  </div>
                  <Input 
                    value={form.confirmation_message || "Your response has been recorded."} 
                    onChange={(e) => updateSetting("confirmation_message", e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Access</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Who can respond</h4>
                  </div>
                  <Select value={form.access_level || "public"} onValueChange={(val) => updateSetting("access_level", val)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Anyone with link</SelectItem>
                      <SelectItem value="rgukt_only">RGUKT Users only</SelectItem>
                      <SelectItem value="restricted">Restricted access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>

      {/* Theme Drawer */}
      {themePanelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/20" onClick={() => setThemePanelOpen(false)}></div>
          <div className="ml-auto w-80 h-full bg-background border-l shadow-xl relative z-10 flex flex-col animate-in slide-in-from-right-full duration-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">Theme options</h3>
              <Button variant="ghost" size="icon" onClick={() => setThemePanelOpen(false)}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 space-y-8 overflow-y-auto">
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-4 tracking-wider">Color</h4>
                <div className="flex flex-wrap gap-3">
                  {["hsl(262.1 83.3% 57.8%)", "#db4437", "#f4b400", "#0f9d58", "#673ab7", "#ff6d00", "#00bcd4", "#607d8b"].map(color => (
                    <button 
                      key={color} 
                      className={`h-8 w-8 rounded-full border-2 focus:outline-none transition-transform ${form.theme_color === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateSetting("theme_color", color)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-4 tracking-wider">Background</h4>
                <div className="flex flex-wrap gap-3">
                  {["hsl(240 20% 98%)", "#f0ebf8", "#e8f0fe", "#fce8e6", "#fef7e0", "#e6f4ea"].map(color => (
                    <button 
                      key={color} 
                      className={`h-8 w-8 rounded-full border border-border focus:outline-none transition-transform ${form.background_color === color ? 'ring-2 ring-foreground scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateSetting("background_color", color)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs uppercase font-semibold text-muted-foreground mb-4 tracking-wider">Font style</h4>
                <Select value={form.font_family || "Basic"} onValueChange={(val) => updateSetting("font_family", val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Playful">Playful</SelectItem>
                    <SelectItem value="Formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Dialog */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send form</DialogTitle>
            <DialogDescription>
              Share this link to collect responses from your audience.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/forms/${formId}/view` : ''}
              />
            </div>
            <Button size="sm" className="px-3" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}/view`);
              toast.success("Link copied to clipboard");
            }}>
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setSendModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- QuestionCard Component ---
function QuestionCard({ 
  question, 
  isActive, 
  updateQuestion, 
  deleteQuestion, 
  duplicateQuestion 
}: { 
  question: Question, 
  isActive: boolean,
  updateQuestion: (id: string, updates: Partial<Question>) => void,
  deleteQuestion: (id: string) => void,
  duplicateQuestion: (id: string) => void
}) {
  
  const handleOptionChange = (idx: number, text: string) => {
    if (!question.options) return;
    const newOpts = [...question.options];
    newOpts[idx] = { ...newOpts[idx], text };
    updateQuestion(question.id, { options: newOpts });
  };

  const addOption = () => {
    const newOpts = [...(question.options || []), { id: crypto.randomUUID(), text: `Option ${(question.options?.length || 0) + 1}` }];
    updateQuestion(question.id, { options: newOpts });
  };

  const removeOption = (idx: number) => {
    if (!question.options || question.options.length <= 1) return;
    const newOpts = question.options.filter((_, i) => i !== idx);
    updateQuestion(question.id, { options: newOpts });
  };

  if (!isActive) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card">
        <CardContent className="p-6">
          <div className="font-medium text-base mb-4">
            {question.title || "Untitled Question"} {question.required && <span className="text-destructive">*</span>}
          </div>
          <div className="text-muted-foreground">
            {["Short answer", "Paragraph", "Date", "Time", "File upload"].includes(question.type) ? (
              <div className="border-b border-border border-dashed pb-2 w-1/2 min-w-[200px]">
                {question.type} text
              </div>
            ) : (
              <div className="space-y-2">
                {question.options?.map(opt => (
                  <div key={opt.id} className="flex items-center gap-2">
                    {question.type === "Multiple choice" ? <div className="h-4 w-4 rounded-full border border-border" /> : null}
                    {question.type === "Checkboxes" ? <div className="h-4 w-4 rounded-sm border border-border" /> : null}
                    {question.type === "Dropdown" ? <span className="text-sm border rounded px-2 py-0.5">▼</span> : null}
                    <span className="text-sm">{opt.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary shadow-md bg-card">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <Input 
            value={question.title}
            onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
            className="flex-1 text-base bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:bg-background"
            placeholder="Question title"
          />
          <Select 
            value={question.type} 
            onValueChange={(val) => updateQuestion(question.id, { type: val as QuestionType })}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Short answer">Short answer</SelectItem>
              <SelectItem value="Paragraph">Paragraph</SelectItem>
              <Separator className="my-1" />
              <SelectItem value="Multiple choice">Multiple choice</SelectItem>
              <SelectItem value="Checkboxes">Checkboxes</SelectItem>
              <SelectItem value="Dropdown">Dropdown</SelectItem>
              <Separator className="my-1" />
              <SelectItem value="Linear scale">Linear scale</SelectItem>
              <Separator className="my-1" />
              <SelectItem value="Date">Date</SelectItem>
              <SelectItem value="Time">Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          {["Short answer", "Paragraph"].includes(question.type) && (
            <div className="border-b border-border border-dashed pb-2 w-1/2 min-w-[200px] text-muted-foreground text-sm">
              {question.type} text
            </div>
          )}

          {["Multiple choice", "Checkboxes", "Dropdown"].includes(question.type) && (
            <div className="space-y-3">
              {question.options?.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-3">
                  {question.type === "Multiple choice" ? <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" /> : null}
                  {question.type === "Checkboxes" ? <div className="h-4 w-4 rounded-sm border border-border flex-shrink-0" /> : null}
                  {question.type === "Dropdown" ? <span className="text-sm font-medium w-4 text-center">{idx + 1}.</span> : null}
                  
                  <Input 
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 border-transparent hover:border-border focus-visible:ring-0 shadow-none h-8 px-2"
                  />
                  
                  <Button variant="ghost" size="icon" onClick={() => removeOption(idx)} disabled={(question.options?.length || 0) <= 1} className="h-8 w-8 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-3 pl-7 mt-2">
                <Button variant="link" onClick={addOption} className="h-auto p-0 text-muted-foreground hover:text-primary">
                  Add option
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-end p-4 gap-4 bg-muted/20">
        <Button variant="ghost" size="icon" onClick={() => duplicateQuestion(question.id)} title="Duplicate">
          <Copy className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)} title="Delete">
          <Trash2 className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div className="w-[1px] h-6 bg-border mx-2"></div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Required</span>
          <Checkbox 
            checked={question.required} 
            onCheckedChange={(c) => updateQuestion(question.id, { required: !!c })} 
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => duplicateQuestion(question.id)}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteQuestion(question.id)} className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
