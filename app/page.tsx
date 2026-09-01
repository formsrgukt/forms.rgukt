"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

// Types
type Form = {
  id: string;
  title: string;
  theme: string;
  created_at: string;
};

export default function Home() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Toast State
  const [toasts, setToasts] = useState<{id: number, message: string}[]>([]);
  
  // Delete Modal State
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  // Load initial data from Supabase
  useEffect(() => {
    const fetchForms = async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching forms:", error);
        showToast("Error loading forms");
      } else {
        setForms(data || []);
      }
      setIsLoading(false);
    };

    fetchForms();
  }, []);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Actions
  const createForm = async (type: string) => {
    setIsLoading(true);
    let title = "Untitled Form";
    if (type !== "Blank") title = type;
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('forms')
      .insert([{ title, theme: 'purple' }])
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating form:", error);
      showToast("Error creating form");
      setIsLoading(false);
      return;
    }

    setForms([data, ...forms]);
    setIsLoading(false);
    showToast(`Created new ${type} form`);
    router.push(`/forms/${data.id}/edit`);
  };

  const handleDelete = async () => {
    if (!deleteFormId) return;
    
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', deleteFormId);

    if (error) {
      console.error("Error deleting form:", error);
      showToast("Error deleting form");
    } else {
      const updated = forms.filter(f => f.id !== deleteFormId);
      setForms(updated);
      showToast("Form deleted successfully");
    }
    setDeleteFormId(null);
  };

  const filteredForms = forms.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.pageWrapper}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="currentColor"/>
              <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 13H16M8 17H16M8 9H10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          RGUKT Forms
        </div>
        
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search forms..." 
            className={styles.searchBar}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className={styles.navArea}>
          <Link href="/login" className={styles.authButton}>
            Sign in
          </Link>
        </div>
      </header>

      <main>
        {/* Template Gallery */}
        <section className={styles.templateSection}>
          <div className={styles.templateContainer}>
            <h2 className={styles.sectionTitle}>Start a new form</h2>
            <div className={styles.templateCards}>
              
              <div 
                className={styles.templateCard} 
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
                onClick={() => createForm("Blank")}
              >
                <div className={styles.templateIcon} style={{ fontSize: '3rem', color: '#db4437' }}>+</div>
                <span className={styles.templateLabel}>Blank</span>
              </div>
              
              <div className={styles.templateCard} onClick={() => createForm("Contact Information")}>
                <div className={styles.templateIcon} style={{ fontSize: '2rem' }}>📱</div>
                <span className={styles.templateLabel}>Contact Information</span>
              </div>
              
              <div className={styles.templateCard} onClick={() => createForm("RSVP")}>
                <div className={styles.templateIcon} style={{ fontSize: '2rem' }}>✉️</div>
                <span className={styles.templateLabel}>RSVP</span>
              </div>
              
              <div className={styles.templateCard} onClick={() => createForm("Party Invite")}>
                <div className={styles.templateIcon} style={{ fontSize: '2rem' }}>🎉</div>
                <span className={styles.templateLabel}>Party Invite</span>
              </div>
              
            </div>
          </div>
        </section>

        {/* Recent Forms */}
        <section className={styles.recentSection}>
          <div className={styles.recentHeader}>
            <h2 className={styles.recentHeaderTitle}>Recent forms</h2>
          </div>
          
          {isLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner}></div>
              <p style={{ marginTop: '1rem' }}>Loading your forms...</p>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No forms found. Create one above!</p>
            </div>
          ) : (
            <div className={styles.formsGrid}>
              {filteredForms.map((form) => (
                <div key={form.id} className={styles.formCard} onClick={() => router.push(`/forms/${form.id}/edit`)}>
                  <div className={styles.formCardPreview}>
                    📄
                  </div>
                  <div className={styles.formCardContent}>
                    <h3 className={styles.formCardTitle}>{form.title}</h3>
                    <p className={styles.formCardDate}>
                      {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={styles.formCardActions} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={styles.actionIconBtn} 
                      title="Preview"
                      onClick={() => showToast(`Previewing ${form.title}`)}
                    >
                      👁️
                    </button>
                    <button 
                      className={styles.actionIconBtn} 
                      title="Responses"
                      onClick={() => showToast(`Viewing responses for ${form.title}`)}
                    >
                      📊
                    </button>
                    <button 
                      className={styles.actionIconBtn} 
                      title="Share"
                      onClick={() => showToast(`Share link copied for ${form.title}`)}
                    >
                      🔗
                    </button>
                    <button 
                      className={`${styles.actionIconBtn} ${styles.delete}`} 
                      title="Delete"
                      onClick={() => setDeleteFormId(form.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteFormId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteFormId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete form?</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete this form? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteFormId(null)}>
                Cancel
              </button>
              <button className={styles.btnDelete} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={styles.toast}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
