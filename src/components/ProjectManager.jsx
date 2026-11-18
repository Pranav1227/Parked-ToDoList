import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, Check, Folder } from 'lucide-react';
import { PROJECT_COLORS } from '../constants';
import { useProjects } from '../context/ProjectsContext';
import { useNotes } from '../context/NotesContext';

export function ProjectManager() {
  const {
    projects,
    createProject,
    renameProject,
    deleteProject,
    isManagingProjects,
    setIsManagingProjects,
  } = useProjects();
  const { cleanUpProjectReferences } = useNotes();

  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [validationError, setValidationError] = useState('');
  const newNameInputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsManagingProjects(false);
      }
    }
    if (isManagingProjects) {
      window.addEventListener('keydown', handleKeyDown);
      setValidationError('');
      setTimeout(() => newNameInputRef.current?.focus(), 60);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManagingProjects, setIsManagingProjects]);

  if (!isManagingProjects) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) return;

    setValidationError('');
    const created = createProject(trimmed);
    if (!created) {
      setValidationError('A project with this name already exists.');
      return;
    }
    setNewProjectName('');
  };

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setConfirmDeleteId(null);
    setValidationError('');
  };

  const handleSaveRename = (id) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setValidationError('Project name cannot be empty.');
      return;
    }

    setValidationError('');
    const success = renameProject(id, trimmed);
    if (success === false) {
      setValidationError('A project with this name already exists.');
      return;
    }
    setEditingId(null);
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => setIsManagingProjects(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-manager-title"
    >
      <div
        className="modal-content-card project-manager-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="project-manager-header">
          <div className="project-manager-title-group">
            <Folder size={18} className="folder-icon" />
            <h2 id="project-manager-title" className="project-manager-heading">
              Manage Projects
            </h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsManagingProjects(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="project-create-form">
          <input
            ref={newNameInputRef}
            type="text"
            className="modal-input project-create-input"
            placeholder="New project name..."
            value={newProjectName}
            onChange={(e) => {
              setNewProjectName(e.target.value);
              if (validationError) setValidationError('');
            }}
          />
          <button
            type="submit"
            className="btn-primary project-create-btn"
            disabled={!newProjectName.trim()}
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </form>

        {validationError && (
          <div className="form-inline-error" style={{ margin: '0 0 10px 0', fontSize: '12px' }}>
            {validationError}
          </div>
        )}

        <div className="project-list-container">
          {projects.length === 0 ? (
            <div className="project-empty-hint">
              No projects created yet. Add your first project above.
            </div>
          ) : (
            projects.map((proj) => {
              const color = PROJECT_COLORS[proj.colorIndex % 8]?.dot || '#64748B';
              const isEditing = editingId === proj.id;
              const isDeleting = confirmDeleteId === proj.id;

              return (
                <div key={proj.id} className="project-list-item">
                  <span
                    className="project-dot"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />

                  {isEditing ? (
                    <div className="project-edit-inline">
                      <input
                        type="text"
                        className="modal-input project-inline-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(proj.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="icon-btn-sm"
                        onClick={() => handleSaveRename(proj.id)}
                        title="Save rename"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn-sm"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="project-item-name">{proj.name}</span>
                  )}

                  {!isEditing && (
                    <div className="project-item-actions">
                      {isDeleting ? (
                        <div className="project-confirm-delete-group">
                          <span className="confirm-delete-text">Delete?</span>
                          <button
                            type="button"
                            className="btn-danger-sm"
                            onClick={() => {
                              cleanUpProjectReferences(proj.id);
                              deleteProject(proj.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            className="btn-secondary-sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="icon-btn-sm"
                            onClick={() => startEditing(proj)}
                            title="Rename project"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn-sm delete"
                            onClick={() => setConfirmDeleteId(proj.id)}
                            title="Delete project (notes become 'No project')"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="project-manager-footer-note">
          Deleting a project moves its notes to <strong>No project</strong>. Notes are never deleted.
        </div>
      </div>
    </div>
  );
}
