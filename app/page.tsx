"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileText, Settings, MoreVertical, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, writeBatch, where, getCountFromServer, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface FormSchema {
  id: string;
  title: string;
  description: string;
  theme: string;
  created_at: string;
  response_count?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "forms"), orderBy("created_at", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc || null);
      setHasMore(querySnapshot.docs.length === 20);

      const formsList: FormSchema[] = await Promise.all(
        querySnapshot.docs.map(async (d) => {
          const formData = { id: d.id, ...d.data() } as FormSchema;
          
          try {
            const resQ = query(collection(db, "responses"), where("form_id", "==", d.id));
            const snapshot = await getCountFromServer(resQ);
            formData.response_count = snapshot.data().count;
          } catch (err) {
            console.error("Error fetching count", err);
            formData.response_count = 0;
          }
          
          return formData;
        })
      );
      
      setForms(formsList);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreForms = async () => {
    if (!lastVisible || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(collection(db, "forms"), orderBy("created_at", "desc"), startAfter(lastVisible), limit(20));
      const querySnapshot = await getDocs(q);
      
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc || null);
      setHasMore(querySnapshot.docs.length === 20);

      const newFormsList: FormSchema[] = await Promise.all(
        querySnapshot.docs.map(async (d) => {
          const formData = { id: d.id, ...d.data() } as FormSchema;
          try {
            const resQ = query(collection(db, "responses"), where("form_id", "==", d.id));
            const snapshot = await getCountFromServer(resQ);
            formData.response_count = snapshot.data().count;
          } catch (err) {
            formData.response_count = 0;
          }
          return formData;
        })
      );
      setForms(prev => [...prev, ...newFormsList]);
    } catch (error) {
      console.error("Error fetching more forms:", error);
      toast.error("Failed to load more forms");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const createForm = async (title: string = "Untitled Form") => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "forms"), {
        title: title,
        description: "",
        theme: "purple",
        created_at: new Date().toISOString(),
      });
      toast.success("Form created successfully");
      router.push(`/forms/${docRef.id}/edit`);
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error("Error creating form");
      setLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) return;
    
    try {
      // 1. Delete the form document
      await deleteDoc(doc(db, "forms", formId));
      
      // 2. Delete all questions for this form
      const qSnap = await getDocs(query(collection(db, "questions"), where("form_id", "==", formId)));
      const batch = writeBatch(db);
      qSnap.docs.forEach((d) => batch.delete(d.ref));
      
      // 3. Delete all responses for this form
      const rSnap = await getDocs(query(collection(db, "responses"), where("form_id", "==", formId)));
      rSnap.docs.forEach((d) => batch.delete(d.ref));
      
      await batch.commit();

      setForms(forms.filter(f => f.id !== formId));
      toast.success("Form and all associated data deleted");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Error deleting form");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground font-bold">R</div>
            <span className="font-bold text-lg hidden sm:inline-block">RGUKT Forms</span>
          </div>
          
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="w-full max-w-md relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search forms..."
                className="w-full bg-muted shadow-none appearance-none pl-9 rounded-full border-transparent focus-visible:ring-1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-muted">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl py-8 px-4 sm:px-6">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Good morning, Faculty</h1>
          <p className="text-muted-foreground">What would you like to create?</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            <Card className="cursor-pointer hover:border-primary transition-colors hover:shadow-md border-muted" onClick={() => createForm("Untitled Form")}>
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Blank Form</CardTitle>
                <CardDescription>Start fresh</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="cursor-pointer hover:border-secondary transition-colors hover:shadow-md border-muted" onClick={() => createForm("Student Feedback")}>
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Feedback</CardTitle>
                <CardDescription>Collect student feedback</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="cursor-pointer hover:border-success transition-colors hover:shadow-md border-muted" onClick={() => createForm("Event Registration")}>
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center mb-2">
                  <Settings className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Registration</CardTitle>
                <CardDescription>Register participants</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Forms</h2>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse border-muted">
                  <div className="h-32 bg-muted/50 rounded-t-lg" />
                  <CardContent className="py-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : forms.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {forms.map(form => (
                  <Card key={form.id} className="group overflow-hidden flex flex-col h-full hover:shadow-md transition-all border-muted">
                    <div 
                      className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 border-b flex items-center justify-center text-primary/30 group-hover:text-primary/50 transition-colors cursor-pointer" 
                      onClick={() => router.push(`/forms/${form.id}/edit`)}
                    >
                      <FileText className="h-10 w-10" />
                    </div>
                    <CardContent className="p-4 flex-grow cursor-pointer" onClick={() => router.push(`/forms/${form.id}/edit`)}>
                      <h3 className="font-semibold text-base line-clamp-1">{form.title || "Untitled Form"}</h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(form.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter className="px-4 py-3 bg-muted/30 border-t flex items-center justify-between mt-auto">
                      {form.response_count ? (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{form.response_count} Responses</span>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded border">Draft</span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/forms/${form.id}/edit`)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}/view`, '_blank')}>Preview</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteForm(form.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button variant="outline" onClick={loadMoreForms} disabled={loadingMore}>
                    {loadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">No forms created</h3>
                <p className="text-sm text-muted-foreground mb-6 mt-2">
                  You haven't created any forms yet. Start collecting responses now.
                </p>
                <Button onClick={() => createForm("Untitled Form")}>
                  <Plus className="mr-2 h-4 w-4" /> Create Form
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
