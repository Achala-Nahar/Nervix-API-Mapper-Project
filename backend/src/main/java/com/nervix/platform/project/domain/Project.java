package com.nervix.platform.project.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import com.nervix.platform.organization.domain.Organization;
import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "projects")
public class Project extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) private Organization organization;
    @Column(nullable = false, length = 150) private String name;
    @Column(columnDefinition = "TEXT") private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private ProjectType projectType;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private ProjectVisibility visibility;
    @Column(nullable = false, length = 30) private String status = "ACTIVE";
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_tags", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "tag", length = 50) private Set<String> tags = new LinkedHashSet<>();
    protected Project() {}
    public Project(Organization organization, String name, String description, ProjectType type, ProjectVisibility visibility, Set<String> tags) {
        this.organization = organization; update(name, description, type, visibility, tags);
    }
    public void update(String name, String description, ProjectType type, ProjectVisibility visibility, Set<String> tags) {
        this.name = name.trim(); this.description = description == null || description.isBlank() ? null : description.trim();
        this.projectType = type; this.visibility = visibility; this.tags.clear();
        if (tags != null) tags.stream().map(String::trim).filter(s -> !s.isBlank()).forEach(this.tags::add);
    }
    public Organization getOrganization(){return organization;} public String getName(){return name;}
    public String getDescription(){return description;} public ProjectType getProjectType(){return projectType;}
    public ProjectVisibility getVisibility(){return visibility;} public String getStatus(){return status;}
    public Set<String> getTags(){return Set.copyOf(tags);}
}
