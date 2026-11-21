import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { scrollToTop } from '../../shared/utils/scroll';
import { ResumeRecord } from './resume.models';
import { ResumeService } from './resume.service';

@Component({
  selector: 'app-resume-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, PageHeaderComponent, LoadingStateComponent],
  template: `
    <app-page-header title="Resumes" description="Upload PDF CVs once, then attach them to applications.">
      <button class="primary-button" type="button" (click)="openCreate()"><mat-icon>upload_file</mat-icon> Upload resume</button>
    </app-page-header>

    @if (error) { <div class="error">{{ error }}</div> }

    @if (showForm) {
      <form class="form-card" [formGroup]="form" (ngSubmit)="submit()">
        <h2>{{ editingId ? 'Edit resume details' : 'Upload resume' }}</h2>
        <div class="fields two">
          <label>Title
            <input formControlName="title" placeholder="e.g. Product Design v4" />
            @if (form.controls.title.touched && form.controls.title.invalid) { <small>Title is required.</small> }
          </label>
          @if (!editingId) {
            <label>PDF file
              <input type="file" accept="application/pdf,.pdf" (change)="onFileSelected($event)" />
              @if (fileError) { <small>{{ fileError }}</small> }
            </label>
          }
        </div>
        <label>Short description
          <textarea rows="3" formControlName="description" placeholder="What this version emphasizes"></textarea>
        </label>
        <div class="mt-2 flex justify-end gap-[.65rem] border-t border-af-divider pt-5">
          <button class="secondary-button" type="button" (click)="closeForm()">Cancel</button>
          <button class="primary-button" type="submit" [disabled]="saving">{{ saving ? 'Saving…' : (editingId ? 'Save details' : 'Upload') }}</button>
        </div>
      </form>
    }

    @if (previewUrl) {
      <section class="panel mb-4">
        <div class="mb-[.85rem] flex items-center justify-between gap-4">
          <div>
            <h2 class="m-0 text-[1rem]">{{ previewTitle }}</h2>
            <p class="m-0 mt-[.2rem] text-[.75rem] text-af-text-faint">Inline PDF preview</p>
          </div>
          <button class="secondary-button" type="button" (click)="closePreview()"><mat-icon>close</mat-icon> Close</button>
        </div>
        <iframe class="h-[min(70vh,820px)] w-full rounded-af border border-af-border bg-white" [src]="previewUrl" title="Resume preview"></iframe>
      </section>
    }

    @if (loading) { <app-loading-state message="Loading resumes…" /> }
    @else if (!resumes.length) {
      <div class="empty">
        <mat-icon>description</mat-icon>
        <h2>No resumes yet</h2>
        <p>Upload a PDF CV to reuse across applications.</p>
        <button class="primary-button" type="button" (click)="openCreate()">Upload resume</button>
      </div>
    }
    @else {
      <section class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-stretch gap-4">
        @for (resume of resumes; track resume.id) {
          <article class="panel flex h-full flex-col">
            <header class="mb-3 flex items-start justify-between gap-3">
              <div class="flex flex-col gap-1">
                <strong class="text-[.95rem] text-af-text">{{ resume.title }}</strong>
                <span class="text-[.78rem] text-af-text-faint">{{ resume.fileName }} · {{ formatSize(resume.fileSize) }}</span>
              </div>
              <mat-icon class="text-af-accent">picture_as_pdf</mat-icon>
            </header>
            <p class="m-0 mb-4 flex-1 text-[.78rem] leading-[1.55] text-af-text-faint">{{ resume.description || 'No description added.' }}</p>
            <div class="mt-auto flex items-center justify-between gap-3 border-t border-af-divider pt-3">
              <button class="secondary-button" type="button" (click)="preview(resume)"><mat-icon>visibility</mat-icon> View</button>
              <div class="flex items-center gap-3">
                <button class="text-button" type="button" (click)="edit(resume)">Edit</button>
                <button class="danger-text" type="button" (click)="remove(resume)">Delete</button>
              </div>
            </div>
          </article>
        }
      </section>
    }
  `,
})
export class ResumePageComponent implements OnInit, OnDestroy {
  private readonly service = inject(ResumeService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)],
  });

  resumes: ResumeRecord[] = [];
  loading = true;
  saving = false;
  showForm = false;
  editingId: string | null = null;
  selectedFile: File | null = null;
  fileError = '';
  error = '';
  previewUrl: SafeResourceUrl | null = null;
  previewTitle = '';
  private objectUrl: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.service.list().subscribe({
      next: items => {
        this.resumes = items;
        this.loading = false;
      },
      error: () => {
        this.error = 'Resumes could not be loaded.';
        this.loading = false;
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.selectedFile = null;
    this.fileError = '';
    this.form.reset({ title: '', description: '' });
    this.showForm = true;
    scrollToTop();
  }

  edit(resume: ResumeRecord): void {
    this.editingId = resume.id;
    this.selectedFile = null;
    this.fileError = '';
    this.form.reset({ title: resume.title, description: resume.description ?? '' });
    this.showForm = true;
    scrollToTop();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.selectedFile = null;
    this.fileError = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError = '';
    if (!file) {
      this.selectedFile = null;
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.fileError = 'Only PDF files are supported.';
      this.selectedFile = null;
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.fileError = 'Files must be 10MB or smaller.';
      this.selectedFile = null;
      return;
    }
    this.selectedFile = file;
    if (!this.form.controls.title.value) {
      this.form.controls.title.setValue(file.name.replace(/\.pdf$/i, ''));
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (!this.editingId && !this.selectedFile) {
      this.fileError = 'Choose a PDF file to upload.';
      return;
    }

    this.saving = true;
    this.error = '';
    const { title, description } = this.form.getRawValue();
    const request$ = this.editingId
      ? this.service.update(this.editingId, title, description)
      : this.service.upload(title, description, this.selectedFile!);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.load();
      },
      error: () => {
        this.error = this.editingId ? 'Resume details could not be saved.' : 'Resume could not be uploaded.';
        this.saving = false;
      },
    });
  }

  preview(resume: ResumeRecord): void {
    this.error = '';
    this.service.fileBlob(resume.id).subscribe({
      next: blob => {
        this.revokePreview();
        this.objectUrl = URL.createObjectURL(blob);
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        this.previewTitle = resume.title;
      },
      error: () => this.error = 'Resume preview could not be loaded.',
    });
  }

  closePreview(): void {
    this.revokePreview();
    this.previewUrl = null;
    this.previewTitle = '';
  }

  remove(resume: ResumeRecord): void {
    this.confirmDialog.confirm({
      title: 'Delete resume',
      message: `Delete “${resume.title}”? Applications using it will keep no linked resume.`,
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(resume.id).subscribe({
        next: () => {
          if (this.previewTitle === resume.title) this.closePreview();
          this.load();
        },
        error: () => this.error = 'Resume could not be deleted.',
      });
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private revokePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
