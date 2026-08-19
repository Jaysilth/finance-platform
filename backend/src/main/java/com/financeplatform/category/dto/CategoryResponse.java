package com.financeplatform.category.dto;

import com.financeplatform.category.entity.Category;
import com.financeplatform.category.entity.CategoryType;
import lombok.Builder;

import java.util.UUID;

@Builder
public record CategoryResponse(
        UUID id,
        String name,
        CategoryType type,
        boolean isDefault
) {
    public static CategoryResponse from(Category c) {
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .type(c.getType())
                .isDefault(c.isDefault())
                .build();
    }
}
