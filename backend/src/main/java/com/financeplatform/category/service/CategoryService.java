package com.financeplatform.category.service;

import com.financeplatform.category.dto.CategoryRequest;
import com.financeplatform.category.dto.CategoryResponse;
import com.financeplatform.category.entity.Category;
import com.financeplatform.category.repository.CategoryRepository;
import com.financeplatform.common.exception.InvalidRequestException;
import com.financeplatform.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listVisible(UUID userId) {
        return categoryRepository.findVisibleToUser(userId).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request, UUID userId) {
        Category category = Category.builder()
                .userId(userId)
                .name(request.name())
                .type(request.type())
                .build();
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        Category category = categoryRepository.findByIdVisibleToUser(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (category.isDefault() || category.getUserId() == null) {
            throw new InvalidRequestException("Default categories cannot be deleted");
        }
        if (!userId.equals(category.getUserId())) {
            throw new ResourceNotFoundException("Category not found");
        }
        categoryRepository.delete(category);
    }
}
