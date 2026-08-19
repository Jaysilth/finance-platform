package com.financeplatform.account.repository;

import com.financeplatform.account.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    List<Account> findByUserIdOrderByCreatedAtAsc(UUID userId);

    // Every lookup by id is also scoped by userId — this is the ownership
    // check. A request for someone else's account id simply returns empty,
    // which the service layer turns into a 404 (never a 403 that would
    // confirm the resource exists).
    Optional<Account> findByIdAndUserId(UUID id, UUID userId);
}
