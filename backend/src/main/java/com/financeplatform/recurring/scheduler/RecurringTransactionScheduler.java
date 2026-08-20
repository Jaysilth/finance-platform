package com.financeplatform.recurring.scheduler;

import com.financeplatform.recurring.service.RecurringTransactionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class RecurringTransactionScheduler {

    private static final Logger log = LoggerFactory.getLogger(RecurringTransactionScheduler.class);

    private final RecurringTransactionService recurringTransactionService;

    // Runs at 1am in the server's JVM timezone — which on Render is UTC
    // unless explicitly configured otherwise. That means "today" for this
    // job may not match "today" in your own timezone right at midnight
    // local time; worth knowing if an occurrence ever seems to post a day
    // off from when you expected it.
    @Scheduled(cron = "0 0 1 * * *")
    public void generateDueTransactions() {
        LocalDate today = LocalDate.now();
        int generated = recurringTransactionService.processAllDue(today);
        if (generated > 0) {
            log.info("Recurring transaction scheduler generated {} transaction(s) for {}", generated, today);
        }
    }
}
