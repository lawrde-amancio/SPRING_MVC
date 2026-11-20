package com.spring.spring_rest.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spring.spring_rest.dto.AuthLoginDto;
import com.spring.spring_rest.dto.AuthRoleRegisterDto;
import com.spring.spring_rest.dto.AuthUserRegisterDto;
import com.spring.spring_rest.entity.Auth_Role;
import com.spring.spring_rest.entity.Auth_User;
import com.spring.spring_rest.repository.AuthRoleRepository;
import com.spring.spring_rest.repository.AuthUserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


/**
 * REST controller responsible for handling user
 *  authentication, user registration,
 * and role creation endpoints under {@code /api/auth}.
 */
@RestController 
@RequestMapping("/api/auth")
public class AuthenticationController {

    private AuthenticationManager authenticationManager;
    private AuthUserRepository authUserRepo;
    private AuthRoleRepository authRoleRepo;
    private BCryptPasswordEncoder passwordEncoder;


    /**
     * Constructs a new {@code AuthenticationController} with the 
     * required security and repository dependencies.
     *
     * @param authenticationManager the manager used to process 
     * authentication requests
     * @param authUserRepo          the repository for managing 
     * {@link Auth_User} entities
     * @param authRoleRepo          the repository for managing 
     * {@link Auth_Role} entities
     * @param passwordEncoder       the encoder used to hash user 
     * passwords before storage
     */
    public AuthenticationController(
        AuthenticationManager authenticationManager,
        AuthUserRepository authUserRepo, AuthRoleRepository authRoleRepo,
        BCryptPasswordEncoder passwordEncoder) {
            this.authenticationManager= authenticationManager;
            this.authUserRepo = authUserRepo;
            this.authRoleRepo = authRoleRepo;
            this.passwordEncoder = passwordEncoder;
        }

    /**
     * Registers a new authorization role in the system if it 
     * does not already exist.
     *
     * @param authRoleRegisterDto the DTO containing the name of the 
     * role to be created
     * @return a {@link ResponseEntity} with status {@code 200 OK} 
     * if created successfully,
     *         or {@code 400 Bad Request} if the role name already exists
     */
    @PostMapping("/register_authorized_role")
    public ResponseEntity<String> register_authRole(
        @RequestBody AuthRoleRegisterDto authRoleRegisterDto) {
            if(authRoleRepo.existsByName(authRoleRegisterDto.getName())) {
                return new ResponseEntity<>(authRoleRegisterDto.getName() + 
                " already created.",
                        HttpStatus.BAD_REQUEST);
            }

            Auth_Role auth_role = new Auth_Role();
            auth_role.setName(authRoleRegisterDto.getName());

            authRoleRepo.save(auth_role);

            return new ResponseEntity<>(auth_role.getName() +
             " is successfully created", 
                                        HttpStatus.OK);
        }

    /**
     * Registers a new user account with a default {@code USER} 
     * role and an encoded password.
     *
     * @param authUserRegisterDto the DTO containing the new user's 
     * username and raw password
     * @return a {@link ResponseEntity} with status {@code 200 OK} 
     * upon successful registration,
     *         or {@code 400 Bad Request} if the username is already taken
     * @throws RuntimeException if the default {@code USER} role 
     * is not found in the database
     */
    @PostMapping("/register_authorized_user")
    public ResponseEntity<String> register_authUser(
        @RequestBody AuthUserRegisterDto authUserRegisterDto) {
            if(authUserRepo.existsByUsername(
                authUserRegisterDto.getUsername())) {
                return new ResponseEntity<>(
                    authUserRegisterDto.getUsername() + 
                        " is already taken.", HttpStatus.BAD_REQUEST);
            }

            Auth_User auth_user = new Auth_User();
            auth_user.setUsername(authUserRegisterDto.getUsername());
            auth_user.setPassword(passwordEncoder.encode(
                authUserRegisterDto.getPassword()));

            Auth_Role auth_role= authRoleRepo.findByName("USER")
                .orElseThrow(() -> new RuntimeException(
                    "Roles USER not found"));
            auth_user.setRoles(Collections.singletonList(auth_role));

            authUserRepo.save(auth_user);

            return new ResponseEntity<>(auth_user.getUsername() + 
            " is successfully registered",
                                        HttpStatus.OK);
        }

    /**
     * Authenticates a user using their username and password 
     * and stores the authentication
     * details in the current {@link SecurityContextHolder}.
     *
     * @param authLoginDto the DTO containing the login 
     * credentials (username and password)
     * @return a {@link ResponseEntity} containing a confirmation 
     * message with status {@code 200 OK}
     */
    @PostMapping("/auth_login")
    public ResponseEntity<String> login(
        @RequestBody AuthLoginDto authLoginDto) {
        Authentication authenticate = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authLoginDto.getUsername(),
                    authLoginDto.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authenticate);

        return new ResponseEntity<>("Sign in successfully!", HttpStatus.OK);
        
    }

    @PostMapping("auth_login_session")
    public ResponseEntity<?> loginWithSession(@RequestBody AuthLoginDto authLoginDto,
                                                HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authLoginDto.getUsername(),
                                                     authLoginDto.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        HttpSession session = request.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Authenticated successfully via session cookie.");
        return ResponseEntity.ok(response);

    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if(session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Logged out from session container.");
    }
    
    public AuthenticationManager getAuthenticationManager() {
        return authenticationManager;
    }

    public void setAuthenticationManager(
        AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    public AuthUserRepository getAuthUserRepo() {
        return authUserRepo;
    }

    public void setAuthUserRepo(AuthUserRepository authUserRepo) {
        this.authUserRepo = authUserRepo;
    }

    public AuthRoleRepository getAuthRoleRepo() {
        return authRoleRepo;
    }

    public void setAuthRoleRepo(AuthRoleRepository authRoleRepo) {
        this.authRoleRepo = authRoleRepo;
    }

    public BCryptPasswordEncoder getPasswordEncoder() {
        return passwordEncoder;
    }

    public void setPasswordEncoder(BCryptPasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

}
