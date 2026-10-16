/**
 * NeuroScope 3D - API Client Integration Layer
 * 
 * Proposed frontend contracts for future FastAPI + MONAI SegResNet backend.
 * Features safe timeout handling, graceful offline detection, and typed DTOs.
 */

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'maintenance';
  version: string;
  monaiVersion?: string;
  cudaAvailable: boolean;
  activeModel: string;
  timestamp: string;
}

export interface StudyUploadRequest {
  patientDeidentifiedId?: string;
  t1File: File;
  t1ceFile: File;
  t2File: File;
  flairFile: File;
  expertMaskFile?: File;
}

export interface StudyUploadResponse {
  studyId: string;
  status: 'uploaded' | 'queued' | 'validating';
  message: string;
  retentionExpiresAt: string; // Auto-deleted within 24h
  sequenceHashes: Record<string, string>;
}

export interface SegmentationRequest {
  modelName?: string;
  enableUncertainty?: boolean;
  mcDropoutSamples?: number;
}

export interface SegmentationTaskResponse {
  taskId: string;
  studyId: string;
  status: 'queued' | 'preprocessing' | 'inferring' | 'postprocessing' | 'completed' | 'failed';
  progressPercentage: number;
  message: string;
  startedAt: string;
}

export interface StudyStatusResponse {
  studyId: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  progress: number;
  currentStep: string;
  errorMessage?: string;
}

export interface StudyResultsResponse {
  studyId: string;
  modelInfo: {
    name: string;
    version: string;
    inferenceTimeSeconds: number;
  };
  volumes: {
    wtVolumeMl: number;
    tcVolumeMl: number;
    etVolumeMl: number;
    voxelSpacingMm: [number, number, number];
  };
  segmentationNiftiUrl: string;
  uncertaintyMapUrl?: string;
  evaluationMetrics?: {
    wtDice?: number;
    tcDice?: number;
    etDice?: number;
  };
}

export interface StudyReportResponse {
  studyId: string;
  reportJson: any;
  pdfDownloadUrl?: string;
}

export class NeuroScopeApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs: number = 8000) {
    this.baseUrl = (baseUrl || (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`API request to ${url} timed out after ${this.timeoutMs}ms.`);
      }
      throw new Error(`Network error connecting to backend at ${this.baseUrl}: ${err.message || 'Server unreachable'}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Health Check: GET /api/v1/health
   */
  public async checkHealth(): Promise<HealthCheckResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Upload 4-sequence study: POST /api/v1/studies
   */
  public async uploadStudy(request: StudyUploadRequest): Promise<StudyUploadResponse> {
    const formData = new FormData();
    formData.append('t1', request.t1File);
    formData.append('t1ce', request.t1ceFile);
    formData.append('t2', request.t2File);
    formData.append('flair', request.flairFile);
    if (request.expertMaskFile) {
      formData.append('expert_mask', request.expertMaskFile);
    }
    if (request.patientDeidentifiedId) {
      formData.append('deidentified_id', request.patientDeidentifiedId);
    }

    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/studies`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Upload failed (HTTP ${res.status}): ${errorText}`);
    }

    return res.json();
  }

  /**
   * Request segmentation inference: POST /api/v1/studies/{study_id}/segment
   */
  public async startSegmentation(studyId: string, req: SegmentationRequest = {}): Promise<SegmentationTaskResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/studies/${encodeURIComponent(studyId)}/segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Inference trigger failed (HTTP ${res.status}): ${errorText}`);
    }

    return res.json();
  }

  /**
   * Poll study processing status: GET /api/v1/studies/{study_id}/status
   */
  public async getStudyStatus(studyId: string): Promise<StudyStatusResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/studies/${encodeURIComponent(studyId)}/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch status (HTTP ${res.status})`);
    }
    return res.json();
  }

  /**
   * Retrieve segmentation results: GET /api/v1/studies/{study_id}/results
   */
  public async getStudyResults(studyId: string): Promise<StudyResultsResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/studies/${encodeURIComponent(studyId)}/results`);
    if (!res.ok) {
      throw new Error(`Failed to fetch results (HTTP ${res.status})`);
    }
    return res.json();
  }

  /**
   * Retrieve formal provenance and report: GET /api/v1/studies/{study_id}/report
   */
  public async getStudyReport(studyId: string): Promise<StudyReportResponse> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/v1/studies/${encodeURIComponent(studyId)}/report`);
    if (!res.ok) {
      throw new Error(`Failed to fetch report (HTTP ${res.status})`);
    }
    return res.json();
  }
}

export const apiClient = new NeuroScopeApiClient();
