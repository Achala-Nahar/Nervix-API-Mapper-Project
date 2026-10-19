package com.nervix.platform.identity.infrastructure;
import com.nervix.platform.identity.domain.User;import java.util.*;import org.springframework.data.jpa.repository.JpaRepository;
public interface UserRepository extends JpaRepository<User,UUID>{
 Optional<User> findBySupabaseUserIdAndSoftDeletedFalse(UUID subject);Optional<User> findByEmailIgnoreCaseAndSoftDeletedFalse(String email);
 boolean existsByUsernameIgnoreCaseAndSoftDeletedFalse(String username);
}
