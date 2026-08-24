package com.avoverseas.backend.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    public record ExpertDTO(String id, String name, String email) {}

    @GetMapping("/experts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ExpertDTO>> getExperts() {
        List<ExpertDTO> experts = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.EXPERT)
                .map(u -> new ExpertDTO(u.getId().toString(), u.getName(), u.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(experts);
    }
}
