package com.nervix.platform.organization.domain;

import com.nervix.platform.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "organizations")
public class Organization extends BaseEntity {
    @Column(nullable = false, length = 150)
    private String name;
    @Column(nullable = false, length = 100)
    private String slug;
    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    protected Organization() {
    }

    public Organization(String name, String slug) {
        this.name = name;
        this.slug = slug;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }
}
