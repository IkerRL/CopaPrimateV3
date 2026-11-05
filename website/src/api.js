// ===== API pública de la Copa Primate =====
// Se conecta a /api/public/* con tolerancia a fallos: si la API no está encendida,
// recurre limpiamente a los datos estáticos locales.

import { useState, useEffect } from 'react';
import { TEAMS, STANDINGS } from './data';

export const API_BASE = (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/public` : 'http://localhost:3001/api/public')).replace(/\/$/, '');

const TIMEOUT_MS = 6000;

export async function fetchPublic(path) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: ctrl.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Hook para el marcador en vivo (polling cada 10s)
export function useLiveMatch(pollInterval = 10000) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const data = await fetchPublic('/live-match');
        if (mounted) setMatch(data?.match || null);
      } catch {
        if (mounted) setMatch(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    check();
    const timer = setInterval(check, pollInterval);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pollInterval]);

  return { match, isLive: !!(match && match.active !== false && /live|vivo/i.test(match.status || '')), loading };
}

// Hook para equipos confirmados
export function usePublicTeams() {
  const [teams, setTeams] = useState(TEAMS);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPublic('/teams')
      .then((data) => {
        if (mounted && Array.isArray(data?.teams) && data.teams.length > 0) {
          setTeams(data.teams);
          setFromApi(true);
        }
      })
      .catch(() => {
        // Fallback a TEAMS de data.js
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { teams, loading, fromApi };
}

// Hook para partidos y grupos
export function usePublicMatches() {
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState({});
  const [drawCompleted, setDrawCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPublic('/matches')
      .then((data) => {
        if (mounted && data) {
          if (Array.isArray(data.matches)) setMatches(data.matches);
          if (data.groups && typeof data.groups === 'object') setGroups(data.groups);
          setDrawCompleted(!!data.drawCompleted);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { matches, groups, drawCompleted, loading };
}

// Hook para clasificación oficial
export function usePublicStandings() {
  const [standings, setStandings] = useState(STANDINGS);
  const [finishedCount, setFinishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCalculated, setIsCalculated] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPublic('/standings')
      .then((data) => {
        if (mounted && Array.isArray(data?.standings) && data.standings.length > 0) {
          setStandings(data.standings);
          setFinishedCount(data.finishedMatches || 0);
          setIsCalculated(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { standings, finishedCount, isCalculated, loading };
}

// Hook para ajustes de visibilidad y estado del torneo
export function useWebSettings() {
  const [settings, setSettings] = useState({
    showStandings: false,
    showGroups: false,
    showMatches: false,
    tournamentPhase: 'inscripciones',
    activeMatchday: 'J1',
    totalSlots: 16,
    announcementBanner: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchPublic('/settings')
      .then((data) => {
        if (mounted && data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return { settings, loading };
}
