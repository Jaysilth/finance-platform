package com.financeplatform.analytics.controller;

import com.financeplatform.analytics.dto.AnalyticsSummaryResponse;
import com.financeplatform.analytics.service.AnalyticsService;
import com.financeplatform.common.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public AnalyticsSummaryResponse summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        // Defaults to the current calendar month when no range is given —
        // matches what the dashboard needs on first load without forcing
        // the frontend to compute and pass dates for the common case.
        LocalDate effectiveFrom = from != null ? from : YearMonth.now().atDay(1);
        LocalDate effectiveTo = to != null ? to : YearMonth.now().atEndOfMonth();

        return analyticsService.getSummary(CurrentUser.id(), effectiveFrom, effectiveTo);
    }
}
