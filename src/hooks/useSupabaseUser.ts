import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './useTelegram';
import type { TreeType } from '@/lib/types';

function generateReferralCode(telegramId: string): string {
  return `ref_${telegramId}_${Date.now().toString(36)}`;
}

export interface DbUser {
  id: string;
  telegram_id: string;
  username: string;
  first_name: string;
  photo_url: string | null;
  coins: number;
  has_claimed_free_sapling: boolean;
  fruits_apple: number;
  fruits_pear: number;
  fruits_grape: number;
  fruits_fig: number;
  total_trees_grown: number;
  total_fruits_harvested: number;
  total_ads_watched: number;
  ad_task_last_reset_date: string;
  ad_task_ads_watched: number;
  ad_task_total_ads_watched: number;
  referral_code: string;
  referred_by: string | null;
  referral_earnings: number;
  referral_commission_carry: number;
  created_at: string;
  updated_at: string;
}

export interface DbTree {
  id: string;
  user_telegram_id: string;
  tree_type: string;
  planted_at: string;
  waterings_completed: number;
  last_watered_at: string | null;
  harvested: boolean;
}

export function useSupabaseUser() {
  const telegram = useTelegram();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [trees, setTrees] = useState<DbTree[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch user
  useEffect(() => {
    if (!telegram.id) return;
    initUser();
  }, [telegram.id]);

  const initUser = async () => {
    setLoading(true);
    try {
      // Try to fetch existing user
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegram.id)
        .single();

      if (existing) {
        setDbUser(existing as unknown as DbUser);
      } else {
        // Create new user
        const photoUrl = telegram.photoUrl || (window.Telegram?.WebApp?.initDataUnsafe as any)?.user?.photo_url || null;
        const newUser = {
          telegram_id: telegram.id,
          username: telegram.username,
          first_name: telegram.firstName,
          photo_url: photoUrl,
          referral_code: generateReferralCode(telegram.id),
        };
        const { data: created } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();
        if (created) {
          setDbUser(created as unknown as DbUser);
        }
      }

      // Fetch trees
      const { data: userTrees } = await supabase
        .from('trees')
        .select('*')
        .eq('user_telegram_id', telegram.id)
        .order('created_at', { ascending: true });
      
      setTrees((userTrees || []) as unknown as DbTree[]);
    } catch (err) {
      console.error('Error initializing user:', err);
    }
    setLoading(false);
  };

  const updateUser = useCallback(async (updates: Partial<DbUser>) => {
    if (!dbUser) return;
    const { data } = await supabase
      .from('users')
      .update(updates as any)
      .eq('telegram_id', dbUser.telegram_id)
      .select()
      .single();
    if (data) setDbUser(data as unknown as DbUser);
  }, [dbUser]);

  const addTree = useCallback(async (treeType: TreeType) => {
    if (!dbUser) return null;
    const { data } = await supabase
      .from('trees')
      .insert({
        user_telegram_id: dbUser.telegram_id,
        tree_type: treeType,
      } as any)
      .select()
      .single();
    if (data) {
      const newTree = data as unknown as DbTree;
      setTrees(prev => [...prev, newTree]);
      return newTree;
    }
    return null;
  }, [dbUser]);

  const updateTree = useCallback(async (treeId: string, updates: Partial<DbTree>) => {
    const { data } = await supabase
      .from('trees')
      .update(updates as any)
      .eq('id', treeId)
      .select()
      .single();
    if (data) {
      const updated = data as unknown as DbTree;
      setTrees(prev => prev.map(t => t.id === treeId ? updated : t));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!telegram.id) return;
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram.id)
      .single();
    if (data) setDbUser(data as unknown as DbUser);
  }, [telegram.id]);

  const refreshTrees = useCallback(async () => {
    if (!telegram.id) return;
    const { data } = await supabase
      .from('trees')
      .select('*')
      .eq('user_telegram_id', telegram.id)
      .order('created_at', { ascending: true });
    setTrees((data || []) as unknown as DbTree[]);
  }, [telegram.id]);

  return {
    dbUser,
    trees,
    loading,
    updateUser,
    addTree,
    updateTree,
    refreshUser,
    refreshTrees,
    setDbUser,
    setTrees,
  };
}
