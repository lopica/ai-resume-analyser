/**
 * Test fixtures and utilities for E2E and Integration testing
 * 
 * This file provides shared test data, mock responses, and utility functions
 * to ensure consistent testing across all test suites
 */

// Mock resume file content for testing
export const createMockResumeFile = (name = 'test-resume.pdf'): File => {
  // Create a realistic PDF-like blob for testing
  const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
  return new File([pdfContent], name, { type: 'application/pdf' });
};

// Test user credentials for authentication
export const testUsers = {
  validUser: {
    username: 'testuser@example.com',
    password: 'TestPassword123!',
    uuid: 'test-uuid-123',
    displayName: 'Test User'
  },
  invalidUser: {
    username: 'invalid@example.com', 
    password: 'wrongpassword'
  }
} as const;

// Job descriptions for testing different scenarios
export const jobDescriptions = {
  frontend: {
    company: 'TechCorp',
    title: 'Frontend Developer', 
    description: 'We are looking for a skilled React developer with experience in TypeScript, Redux, and modern frontend frameworks. Must have 3+ years of experience building responsive web applications.'
  },
  backend: {
    company: 'DataSoft Inc',
    title: 'Backend Engineer',
    description: 'Seeking a Node.js backend engineer with expertise in APIs, databases, and cloud services. Experience with microservices architecture preferred.'
  },
  fullstack: {
    company: 'StartupXYZ',
    title: 'Full Stack Developer',
    description: 'Join our team as a full-stack developer working with React, Node.js, and AWS. Must be comfortable with both frontend and backend development.'
  }
} as const;

// Expected AI analysis responses for different resume qualities
export const mockAIResponses = {
  excellentResume: {
    overallScore: 92,
    ATS: {
      score: 88,
      tips: [
        { type: 'good', tip: 'Excellent keyword optimization' },
        { type: 'good', tip: 'Strong technical skills section' },
        { type: 'improve', tip: 'Consider adding more quantified achievements' }
      ]
    },
    toneAndStyle: {
      score: 95,
      tips: [
        { type: 'good', tip: 'Professional and engaging tone' },
        { type: 'good', tip: 'Clear and concise language' }
      ]
    },
    content: {
      score: 90,
      tips: [
        { type: 'good', tip: 'Relevant experience highlighted well' },
        { type: 'improve', tip: 'Add more specific project details' }
      ]
    },
    structure: {
      score: 93,
      tips: [
        { type: 'good', tip: 'Logical flow and organization' },
        { type: 'good', tip: 'Appropriate section headers' }
      ]
    },
    skills: {
      score: 87,
      tips: [
        { type: 'good', tip: 'Technical skills well-presented' },
        { type: 'improve', tip: 'Consider grouping related skills' }
      ]
    }
  },
  averageResume: {
    overallScore: 72,
    ATS: {
      score: 68,
      tips: [
        { type: 'improve', tip: 'Add more relevant keywords' },
        { type: 'improve', tip: 'Optimize for ATS scanning' },
        { type: 'good', tip: 'Good use of bullet points' }
      ]
    },
    toneAndStyle: {
      score: 75,
      tips: [
        { type: 'improve', tip: 'Make language more dynamic' },
        { type: 'improve', tip: 'Avoid passive voice' }
      ]
    },
    content: {
      score: 73,
      tips: [
        { type: 'improve', tip: 'Add more quantified achievements' },
        { type: 'improve', tip: 'Include more relevant experience' }
      ]
    },
    structure: {
      score: 76,
      tips: [
        { type: 'improve', tip: 'Improve section organization' },
        { type: 'good', tip: 'Consistent formatting' }
      ]
    },
    skills: {
      score: 70,
      tips: [
        { type: 'improve', tip: 'Add more technical skills' },
        { type: 'improve', tip: 'Remove outdated technologies' }
      ]
    }
  },
  poorResume: {
    overallScore: 45,
    ATS: {
      score: 42,
      tips: [
        { type: 'improve', tip: 'Lacks relevant keywords' },
        { type: 'improve', tip: 'Poor formatting for ATS' },
        { type: 'improve', tip: 'Missing important sections' }
      ]
    },
    toneAndStyle: {
      score: 48,
      tips: [
        { type: 'improve', tip: 'Too informal tone' },
        { type: 'improve', tip: 'Inconsistent writing style' }
      ]
    },
    content: {
      score: 43,
      tips: [
        { type: 'improve', tip: 'Lacks specific achievements' },
        { type: 'improve', tip: 'Irrelevant or outdated experience' }
      ]
    },
    structure: {
      score: 46,
      tips: [
        { type: 'improve', tip: 'Poor organization' },
        { type: 'improve', tip: 'Inconsistent formatting' }
      ]
    },
    skills: {
      score: 44,
      tips: [
        { type: 'improve', tip: 'Limited relevant skills' },
        { type: 'improve', tip: 'No technical proficiency indicated' }
      ]
    }
  }
} as const;

// File system mock responses
export const mockFileSystemResponses = {
  uploadSuccess: {
    path: '/uploads/resume-123.pdf',
    size: 1024576,
    type: 'application/pdf',
    name: 'test-resume.pdf'
  },
  imageConversionSuccess: {
    path: '/uploads/resume-123.png', 
    size: 512000,
    type: 'image/png',
    name: 'test-resume.png'
  },
  directoryListing: [
    {
      id: 'file-1',
      name: 'resume-1.pdf',
      path: '/uploads/resume-1.pdf',
      size: 1024576,
      type: 'file'
    },
    {
      id: 'file-2', 
      name: 'resume-2.pdf',
      path: '/uploads/resume-2.pdf',
      size: 892000,
      type: 'file'
    },
    {
      id: 'dir-1',
      name: 'images',
      path: '/uploads/images',
      size: null,
      type: 'directory'
    }
  ]
} as const;

// KV store mock data
export const mockKVStoreData = {
  'resume:test-uuid-1': JSON.stringify({
    id: 'test-uuid-1',
    resumePath: '/uploads/resume-1.pdf',
    imagePath: '/uploads/resume-1.png',
    companyName: 'TechCorp',
    jobTitle: 'Frontend Developer',
    jobDescription: 'React developer position',
    feedback: mockAIResponses.excellentResume,
    createdAt: '2023-12-01T10:00:00Z'
  }),
  'resume:test-uuid-2': JSON.stringify({
    id: 'test-uuid-2', 
    resumePath: '/uploads/resume-2.pdf',
    imagePath: '/uploads/resume-2.png',
    companyName: 'DataSoft Inc',
    jobTitle: 'Backend Engineer',
    jobDescription: 'Node.js backend position',
    feedback: mockAIResponses.averageResume,
    createdAt: '2023-12-01T11:00:00Z'
  })
} as const;

// Authentication mock responses
export const mockAuthResponses = {
  signInSuccess: {
    user: {
      uuid: testUsers.validUser.uuid,
      username: testUsers.validUser.username,
      displayName: testUsers.validUser.displayName
    },
    token: 'mock-jwt-token-123',
    expiresIn: 3600
  },
  signInFailure: {
    error: 'Invalid credentials',
    code: 'AUTH_FAILED'
  }
} as const;

// Utility functions for test setup
export const testUtils = {
  // Wait for element with custom timeout
  waitForElement: (selector: string, timeout = 30000) => ({
    selector,
    timeout
  }),
  
  // Generate unique test IDs
  generateTestId: (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Create realistic delays for testing async operations
  delays: {
    fileUpload: 2000,
    pdfConversion: 3000, 
    aiAnalysis: 15000,
    navigation: 1000
  }
} as const;

// Error scenarios for testing
export const mockErrorScenarios = {
  fileUploadFailed: {
    error: 'File upload failed',
    code: 'UPLOAD_ERROR',
    details: 'Network timeout during file upload'
  },
  aiServiceUnavailable: {
    error: 'AI service temporarily unavailable',
    code: 'AI_SERVICE_ERROR', 
    details: 'External AI service is down'
  },
  pdfConversionFailed: {
    error: 'PDF conversion failed',
    code: 'CONVERSION_ERROR',
    details: 'Invalid or corrupted PDF file'
  },
  kvStoreError: {
    error: 'Storage service unavailable',
    code: 'STORAGE_ERROR',
    details: 'Unable to save resume metadata'
  }
} as const;