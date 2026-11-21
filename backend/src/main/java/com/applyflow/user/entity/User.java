package com.applyflow.user.entity;

import com.applyflow.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.UUID;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "app_users")
public class User extends BaseEntity implements UserDetails {

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "email_verified", nullable = false)
    @ColumnDefault("false")
    private boolean emailVerified = false;

    protected User() {
    }

    public User(String email, String passwordHash, String displayName) {
        this(email, passwordHash, displayName, false);
    }

    public User(String email, String passwordHash, String displayName, boolean emailVerified) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.emailVerified = emailVerified;
    }

    public UUID getId() {
        return super.getId();
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void markEmailVerified() {
        this.emailVerified = true;
    }

    public void updateDisplayName(String displayName) {
        this.displayName = displayName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
