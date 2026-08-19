package com.financeplatform.category.repository;

import com.financeplatform.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    // Visible categories for a user = their own custom ones + the shared defaults (userId IS NULL).
    @Query("SELECT c FROM Category c WHERE c.userId = :userId OR c.userId IS NULL ORDER BY c.name")
    List<Category> findVisibleToUser(@Param("userId") UUID userId);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.userId = :userId OR c.userId IS NULL)")
    Optional<Category> findByIdVisibleToUser(@Param("id") UUID id, @Param("userId") UUID userId);
}
