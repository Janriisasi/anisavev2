import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabase';

const TutorialCtx = createContext(null);

export function useTutorialContext() {
  return useContext(TutorialCtx);
}

/**
 * Wrap your app with this provider INSIDE your Router and AuthContext.
 *
 * It checks whether the current user has already seen the tutorial using
 * their Supabase profile row (tutorial_done column). Falls back to
 * localStorage if the column isn't added yet.
 *
 * Usage in App.jsx:
 *   <TutorialProvider>
 *     <TutorialOverlay ... />
 *     <YourRoutes />
 *   </TutorialProvider>
 */
export function TutorialProvider({ children }) {
  const [show, setShow] = useState(false);
  const [userId, setUserId] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let subscription;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await checkAndMaybeShow(session.user.id);
      }
      setChecked(true);

      // listen for auth changes (login after signup, etc.)
      const { data } = supabase.auth.onAuthStateChange(async (event, sess) => {
        if (event === 'SIGNED_IN' && sess?.user) {
          setUserId(sess.user.id);
          await checkAndMaybeShow(sess.user.id);
        }
        if (event === 'SIGNED_OUT') {
          setUserId(null);
          setShow(false);
        }
      });
      subscription = data.subscription;
    };

    init();
    return () => subscription?.unsubscribe();
  }, []);

  const checkAndMaybeShow = async (uid) => {
    setUserId(uid);

    // --- Option A: check localStorage (works without DB changes) ---
    const lsKey = `anisave_tutorial_done_${uid}`;
    if (localStorage.getItem(lsKey)) return; // already seen

    // --- Option B (optional — uncomment once you add tutorial_done col) ---
    // try {
    //   const { data } = await supabase
    //     .from('profiles')
    //     .select('tutorial_done')
    //     .eq('id', uid)
    //     .single();
    //   if (data?.tutorial_done) return;
    // } catch (_) {}

    setShow(true);
  };

  const closeTutorial = useCallback(async () => {
    setShow(false);
    if (!userId) return;

    // Mark done in localStorage
    localStorage.setItem(`anisave_tutorial_done_${userId}`, '1');

    // --- Option B (optional — uncomment once you add tutorial_done col) ---
    // try {
    //   await supabase
    //     .from('profiles')
    //     .update({ tutorial_done: true })
    //     .eq('id', userId);
    // } catch (_) {}
  }, [userId]);

  // Expose a manual trigger (e.g. from a Help button)
  const openTutorial = useCallback(() => setShow(true), []);

  return (
    <TutorialCtx.Provider value={{ showTutorial: show, openTutorial, closeTutorial }}>
      {children}
    </TutorialCtx.Provider>
  );
}