package com.nervix.platform.project.domain;
public enum ProjectRole {
    OWNER, ADMIN, EDITOR, VIEWER;
    public boolean canEdit() { return this == OWNER || this == ADMIN || this == EDITOR; }
    public boolean canManage() { return this == OWNER || this == ADMIN; }
}
