package com.avoverseas.backend.common;

import com.avoverseas.backend.user.User;
import com.avoverseas.backend.user.UserRepository;
import com.avoverseas.backend.user.UserRole;
import com.avoverseas.backend.meeting.ExpertAvailability;
import com.avoverseas.backend.meeting.ExpertAvailabilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpertAvailabilityRepository availabilityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            String defaultPassword = passwordEncoder.encode("password123");

            // Seed student
            User student = User.builder()
                    .name("Alice (Student)")
                    .email("student@test.com")
                    .passwordHash(defaultPassword)
                    .role(UserRole.STUDENT)
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(student);

            // Seed expert
            User expert = User.builder()
                    .name("Dr. Smith (Expert)")
                    .email("expert@test.com")
                    .passwordHash(defaultPassword)
                    .role(UserRole.EXPERT)
                    .createdAt(Instant.now())
                    .build();
            User savedExpert = userRepository.save(expert);

            // Seed admin
            User admin = User.builder()
                    .name("Bob (Admin)")
                    .email("admin@test.com")
                    .passwordHash(defaultPassword)
                    .role(UserRole.ADMIN)
                    .createdAt(Instant.now())
                    .build();
            userRepository.save(admin);

            // Seed some default availability for Dr. Smith
            // Monday
            availabilityRepository.save(ExpertAvailability.builder()
                    .expertId(savedExpert.getId())
                    .dayOfWeek(1)
                    .startTime(LocalTime.of(10, 0))
                    .endTime(LocalTime.of(10, 30))
                    .timezone("Asia/Kolkata")
                    .active(true)
                    .build());
            availabilityRepository.save(ExpertAvailability.builder()
                    .expertId(savedExpert.getId())
                    .dayOfWeek(1)
                    .startTime(LocalTime.of(11, 0))
                    .endTime(LocalTime.of(11, 30))
                    .timezone("Asia/Kolkata")
                    .active(true)
                    .build());
            // Tuesday
            availabilityRepository.save(ExpertAvailability.builder()
                    .expertId(savedExpert.getId())
                    .dayOfWeek(2)
                    .startTime(LocalTime.of(15, 0))
                    .endTime(LocalTime.of(15, 30))
                    .timezone("Asia/Kolkata")
                    .active(true)
                    .build());

            System.out.println("--- DB SEEDING COMPLETED ---");
            System.out.println("Student Email: student@test.com");
            System.out.println("Expert Email: expert@test.com");
            System.out.println("Admin Email: admin@test.com");
            System.out.println("Password (all): password123");
            System.out.println("----------------------------");
        }
    }
}
