"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import modalStyles from "@/shared/components/common/modal/Modal.module.css";
import TimelineSection from "@/modules/home/components/timeline-section/TimelineSection";
import LecturerShowcase from "@/modules/home/components/lecturer-showcase/LecturerShowcase";
import Modal from "@/shared/components/common/modal/Modal";
import type { Lecturer } from "@/shared/types/lecturer";
import HeroSection from "@/modules/home/components/hero-section/HeroSection";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { PublicService } from "@/shared/services/publicService";

function lecturerAvatarIndex(contact: string, fallbackIndex: number): number {
  const emailHash = contact
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (emailHash % 4) + 1 || (fallbackIndex % 4) + 1;
}

export default function HomePage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [lecturersLoading, setLecturersLoading] = useState(true);
  const [lecturersError, setLecturersError] = useState<string | null>(null);
  const [activeLecturer, setActiveLecturer] = useState<Lecturer | null>(null);

  const { user, isAuthenticated } = useAuth();
  const userRole = user?.userType || null;

  const loadLecturers = useCallback(async () => {
    setLecturersLoading(true);
    setLecturersError(null);
    try {
      const data = await PublicService.getLecturers();
      setLecturers(data);
    } catch (error) {
      console.error("Failed to load lecturers:", error);
      setLecturersError(
        "Unable to load lecturers right now. Please try again later."
      );
      setLecturers([]);
    } finally {
      setLecturersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLecturers();
  }, [loadLecturers]);

  const handleOpenLecturerModal = (lecturerId: string): void => {
    const lecturer = lecturers.find((l) => l.id === lecturerId);
    if (lecturer) setActiveLecturer(lecturer);
  };

  const handleCloseModal = (): void => {
    setActiveLecturer(null);
  };

  const activeLecturerImageIndex = activeLecturer
    ? lecturers.findIndex((l) => l.id === activeLecturer.id)
    : -1;

  return (
    <main className={`flex-grow ${isAuthenticated ? "pt-0" : "pt-24"}`}>
      <HeroSection />

      <TimelineSection isLoggedIn={isAuthenticated} userRole={userRole} />

      <LecturerShowcase
        lecturers={lecturers}
        isLoading={lecturersLoading}
        error={lecturersError}
        onRetry={loadLecturers}
        onOpenLecturerModal={handleOpenLecturerModal}
      />

      {activeLecturer && (
        <Modal
          isOpen={!!activeLecturer}
          onClose={handleCloseModal}
          maxWidth="800px"
        >
          <div className={modalStyles.modalImageSection}>
            <div className={modalStyles.modalImageContainer}>
              <Image
                src={`/lecturers/lecturer-${lecturerAvatarIndex(activeLecturer.contact, activeLecturerImageIndex)}.jpg`}
                alt={activeLecturer.name}
                width={300}
                height={300}
                className={modalStyles.lecturerImage}
              />
            </div>
          </div>
          <div className={modalStyles.modalContent}>
            <h3 className={modalStyles.modalTitle}>{activeLecturer.name}</h3>
            <p className={modalStyles.modalSubtitle}>
              {activeLecturer.title} · {activeLecturer.specialization}
            </p>
            <p className={modalStyles.modalText}>{activeLecturer.bio}</p>
            <ul className={modalStyles.modalInfoList}>
              <li className={modalStyles.modalInfoItem}>
                <span className={modalStyles.modalInfoIcon}>📚</span>
                <span>
                  <strong>Teaches:</strong> {activeLecturer.courses}
                </span>
              </li>
              {activeLecturer.assignedCourses &&
                activeLecturer.assignedCourses.length > 0 && (
                  <li className={modalStyles.modalInfoItem}>
                    <span className={modalStyles.modalInfoIcon}>🗓️</span>
                    <span>
                      <strong>Semesters:</strong>{" "}
                      {[
                        ...new Set(
                          activeLecturer.assignedCourses.map((c) => c.semester)
                        ),
                      ].join(", ")}
                    </span>
                  </li>
                )}
              <li className={modalStyles.modalInfoItem}>
                <span className={modalStyles.modalInfoIcon}>📧</span>
                <span>
                  <strong>Contact:</strong> {activeLecturer.contact}
                </span>
              </li>
            </ul>
          </div>
        </Modal>
      )}
    </main>
  );
}
