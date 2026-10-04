import { gql } from "@apollo/client";

// Simplified subscription query that exactly matches the backend schema
export const CANDIDATE_BLOCKING_SUBSCRIPTION = gql`
  subscription CandidateBlockingUpdates {
    candidateBlockingUpdates {
      candidateId
      candidateName
      candidateEmail
      isBlocked
      timestamp
      unselectedApplicationsCount
      unrankedApplicationsCount
      affectedLecturerIds
      candidate {
        id
        fullName
        email
        userType
        isBlocked
        createdAt
      }
    }
  }
`;

export interface CandidateBlockedEvent {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  isBlocked: boolean;
  timestamp: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    userType: string;
    isBlocked: boolean;
    createdAt: string;
  };
  unselectedApplicationsCount?: number;
  unrankedApplicationsCount?: number;
  affectedLecturerIds?: string[];
}

export interface UserAccountEvent {
  userId: string;
  userEmail: string;
  userName: string;
  userType: string;
  action: string; // "blocked" or "deleted"
  timestamp: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    userType: string;
    isBlocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
}
