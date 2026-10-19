package com.nervix.platform.project.domain;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class ProjectRoleTest {
    @Test void editPermissionsFollowRoleHierarchy() {
        assertThat(ProjectRole.OWNER.canEdit()).isTrue();
        assertThat(ProjectRole.ADMIN.canEdit()).isTrue();
        assertThat(ProjectRole.EDITOR.canEdit()).isTrue();
        assertThat(ProjectRole.VIEWER.canEdit()).isFalse();
    }

    @Test void onlyOwnersAndAdminsCanManageMembership() {
        assertThat(ProjectRole.OWNER.canManage()).isTrue();
        assertThat(ProjectRole.ADMIN.canManage()).isTrue();
        assertThat(ProjectRole.EDITOR.canManage()).isFalse();
        assertThat(ProjectRole.VIEWER.canManage()).isFalse();
    }
}
