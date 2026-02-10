package com.uknight.videocall;

import com.uknight.videocall.user.User;
import com.uknight.videocall.user.UserService;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;



@SpringBootApplication
public class VideocallApplication {
	static void main(String[] args) {
		SpringApplication.run(VideocallApplication.class, args);
	}

    // login test bean
    @Bean
    public CommandLineRunner commandLineRunner(
        UserService service
    ) {
        return args -> {
            service.register(User.builder()
                        .username("test")
                        .email("test@mail.com")
                        .password("aaa")
                    .build());
            service.register(User.builder()
                        .username("joey")
                        .email("joey@mail.com")
                        .password("aaa")
                    .build());
            service.register(User.builder()
                        .username("ana")
                        .email("ana@mail.com")
                        .password("aaa")
                    .build());
        };
    }

}
