package com.uknight.videocall.user;

// User container

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
// NOTE: AllArgsConstructor and NoArgsConstructor necessary for JSON parsing
@AllArgsConstructor
@NoArgsConstructor
public class User {

    private String username;
    private String email;
    private String password;
    private String status;

}
