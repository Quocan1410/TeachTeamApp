"use client";

import React, { useState, useEffect, useCallback } from "react";
import TimelineSection from "@/modules/home/components/timeline-section/TimelineSection";
import LecturerShowcase from "@/modules/home/components/lecturer-showcase/LecturerShowcase";
import LecturerDetailModal from "@/modules/home/components/lecturer-card/LecturerDetailModal";
import type { Lecturer } from "@/shared/types/lecturer";
import HeroSection from "@/modules/home/components/hero-section/HeroSection";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { PublicService } from "@/shared/services/publicService";
import PageSkeleton from "@/shared/components/common/page-skeleton/PageSkeleton";
import { retainPageBusy } from "@/shared/components/route-pending/loadingIndicator";

function shuffleLecturers(lecturers: Lecturer[]): Lecturer[] {
  const copy = [...lecturers];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  return copy;
}

export default function HomePage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [featuredLecturers, setFeaturedLecturers] = useState<Lecturer[]>([]);
  const [lecturersLoading, setLecturersLoading] = useState(true);
  const [lecturersError, setLecturersError] = useState<string | null>(null);
  const [activeLecturer, setActiveLecturer] = useState<Lecturer | null>(null);
  const [placesOpen, setPlacesOpen] = useState<number | null>(null);
  const [placesLoading, setPlacesLoading] = useState(true);

  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const userRole = user?.userType || null;

  const redirecting =
    !authLoading &&
    isAuthenticated &&
    (user?.userType === "candidate" || user?.userType === "lecturer");

  useEffect(() => {
    if (!redirecting || !user) return;
    if (user.userType === "candidate") {
      router.replace("/tutor");
    } else if (user.userType === "lecturer") {
      router.replace("/lecturer");
    }
  }, [redirecting, user, router]);

  const loadLecturers = useCallback(async () => {
    setLecturersLoading(true);
    setLecturersError(null);
    try {
      const data = await PublicService.getLecturers();
      setLecturers(data);
      setFeaturedLecturers(shuffleLecturers(data).slice(0, 4));
    } catch {
      setLecturersError(
        "Unable to load lecturers right now. Please try again later."
      );
      setLecturers([]);
      setFeaturedLecturers([]);
    } finally {
      setLecturersLoading(false);
    }
  }, []);

  const loadPlaces = useCallback(async () => {
    setPlacesLoading(true);
    try {
      const openings = await PublicService.getOpenings();
      const total = openings
        .filter((opening) => opening.isApplicationOpen)
        .reduce(
          (sum, opening) =>
            sum + opening.tutorPlacesLeft + opening.labAssistantPlacesLeft,
          0
        );
      setPlacesOpen(total);
    } catch {
      setPlacesOpen(null);
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    if (authLoading || redirecting) return;
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }, [authLoading, redirecting]);

  useEffect(() => {
    if (authLoading || redirecting) return;
    void loadLecturers();
    void loadPlaces();
  }, [authLoading, redirecting, loadLecturers, loadPlaces]);

  useEffect(() => {
    const busy =
      authLoading || redirecting || placesLoading || lecturersLoading;
    if (!busy) return;
    return retainPageBusy();
  }, [authLoading, redirecting, placesLoading, lecturersLoading]);

  const handleOpenLecturerModal = (lecturerId: string): void => {
    const lecturer = lecturers.find((l) => l.id === lecturerId);
    if (lecturer) setActiveLecturer(lecturer);
  };

  const handleCloseModal = (): void => {
    setActiveLecturer(null);
  };

  const activeLecturerImageIndex = activeLecturer
    ? featuredLecturers.findIndex((lecturer) => lecturer.id === activeLecturer.id)
    : 0;

  if (authLoading || redirecting) {
    return <PageSkeleton variant="home" />;
  }

  return (
    <div className={isAuthenticated ? "pt-0" : "pt-24"}>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{history.scrollRestoration='manual';var r=document.documentElement;var p=r.style.scrollBehavior;r.style.scrollBehavior='auto';scrollTo(0,0);r.style.scrollBehavior=p;}catch(e){}",
        }}
      />
      <HeroSection placesOpen={placesOpen} placesLoading={placesLoading} />

      <TimelineSection isLoggedIn={isAuthenticated} userRole={userRole} />

      <LecturerShowcase
        lecturers={featuredLecturers}
        isLoading={lecturersLoading}
        error={lecturersError}
        onRetry={loadLecturers}
        onOpenLecturerModal={handleOpenLecturerModal}
      />

      <LecturerDetailModal
        lecturer={activeLecturer}
        imageIndex={activeLecturerImageIndex}
        onClose={handleCloseModal}
      />
    </div>
  );
}
