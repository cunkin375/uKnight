package com.uknight.server.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password; // Hashed password

    private String gender;

    @ElementCollection
    private List<String> interests;

    @ElementCollection
    private List<String> classList;

    private Integer schoolYear;

    @Column(nullable = false, unique = true)
    private String email;

    private String schoolEmail;

    private boolean isReported = false; // "Strike"

    private boolean showUsername = true;

    private boolean isVerified = false;

    private Long timeSpent = 0L; // Time in seconds

    private LocalDateTime joinedDate = LocalDateTime.now();

    private Integer peopleMetCount = 0;

    private String universityName;

    private String profilePictureUrl;
}
