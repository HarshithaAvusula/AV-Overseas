package com.avoverseas.backend.chat;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatModerationService {

    // Regex pattern for emails
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}", Pattern.CASE_INSENSITIVE);

    // Regex pattern for phone numbers (matches 7 to 15 digits, allowing spaces, dashes, parentheses, plus signs)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "(\\+?\\d[\\d\\s\\(\\)-]{6,14}\\d)", Pattern.CASE_INSENSITIVE);

    // Regex pattern for social platform links and telegram/instagram user handles
    private static final Pattern SOCIAL_PATTERN = Pattern.compile(
            "(@[a-zA-Z0-9_]{3,30})|(t\\.me/[a-zA-Z0-9_]{3,30})|(whatsapp|wa\\.me|telegram|instagram|telegram\\.me)[\\w\\./\\?=-]*", 
            Pattern.CASE_INSENSITIVE);

    private static final Map<String, String> NUMBER_WORDS = new HashMap<>();
    static {
        NUMBER_WORDS.put("zero", "0");
        NUMBER_WORDS.put("one", "1");
        NUMBER_WORDS.put("two", "2");
        NUMBER_WORDS.put("three", "3");
        NUMBER_WORDS.put("four", "4");
        NUMBER_WORDS.put("five", "5");
        NUMBER_WORDS.put("six", "6");
        NUMBER_WORDS.put("seven", "7");
        NUMBER_WORDS.put("eight", "8");
        NUMBER_WORDS.put("nine", "9");
    }

    public static class ModerationResult {
        public String moderatedText;
        public boolean containsContactInfo;
        public String moderationAction;

        public ModerationResult(String moderatedText, boolean containsContactInfo, String moderationAction) {
            this.moderatedText = moderatedText;
            this.containsContactInfo = containsContactInfo;
            this.moderationAction = moderationAction;
        }
    }

    public ModerationResult moderate(String originalText) {
        if (originalText == null) {
            return new ModerationResult("", false, "NONE");
        }

        String normalized = normalize(originalText);
        boolean containsInfo = false;

        // Perform moderation on normalized text to detect issues, but we will redact the original text locations.
        // To keep implementation simple, robust, and clean, we will run the regex matches on both the original text 
        // and its normalized counterpart.
        
        String redactedText = originalText;
        
        // 1. Redact Emails
        Matcher emailMatcher = EMAIL_PATTERN.matcher(redactedText);
        if (emailMatcher.find()) {
            containsInfo = true;
            redactedText = emailMatcher.replaceAll("[REDACTED EMAIL]");
        }
        
        // Also check in normalized text (e.g. "test [at] gmail [dot] com" becomes "test@gmail.com")
        Matcher normEmailMatcher = EMAIL_PATTERN.matcher(normalized);
        if (normEmailMatcher.find()) {
            containsInfo = true;
            // If found in normalized but not fully captured in original, redact references in the text.
            redactedText = "[REDACTED EMAIL] (Privacy Filter Triggered)";
        }

        // 2. Redact Phone numbers
        Matcher phoneMatcher = PHONE_PATTERN.matcher(redactedText);
        if (phoneMatcher.find()) {
            // Verify if digits match a valid count (>6 digits)
            String matched = phoneMatcher.group(0).replaceAll("[^\\d]", "");
            if (matched.length() >= 7) {
                containsInfo = true;
                redactedText = phoneMatcher.replaceAll("[REDACTED PHONE]");
            }
        }
        
        // Check normalized phone (where words like "nine eight seven" became "987")
        Matcher normPhoneMatcher = PHONE_PATTERN.matcher(normalized.replaceAll("\\s+", ""));
        if (normPhoneMatcher.find()) {
            String matched = normPhoneMatcher.group(0).replaceAll("[^\\d]", "");
            if (matched.length() >= 7) {
                containsInfo = true;
                redactedText = "[REDACTED PHONE] (Privacy Filter Triggered)";
            }
        }

        // 3. Redact Social Handles/Links
        Matcher socialMatcher = SOCIAL_PATTERN.matcher(redactedText);
        if (socialMatcher.find()) {
            containsInfo = true;
            redactedText = socialMatcher.replaceAll("[REDACTED HANDLE]");
        }

        String action = containsInfo ? "REDACTED" : "NONE";
        return new ModerationResult(redactedText, containsInfo, action);
    }

    private String normalize(String input) {
        if (input == null) return "";
        String normalized = input.toLowerCase();

        // Standardize common obfuscation patterns
        normalized = normalized.replaceAll("\\s*\\[\\s*at\\s*\\]\\s*", "@");
        normalized = normalized.replaceAll("\\s*\\(\\s*at\\s*\\)\\s*", "@");
        normalized = normalized.replaceAll("\\s+at\\s+", "@");
        
        normalized = normalized.replaceAll("\\s*\\[\\s*dot\\s*\\]\\s*", ".");
        normalized = normalized.replaceAll("\\s*\\(\\s*dot\\s*\\)\\s*", ".");
        normalized = normalized.replaceAll("\\s+dot\\s+", ".");

        // Convert word digits: "nine" -> "9", "eight" -> "8"
        for (Map.Entry<String, String> entry : NUMBER_WORDS.entrySet()) {
            normalized = normalized.replaceAll("\\b" + entry.getKey() + "\\b", entry.getValue());
        }

        return normalized;
    }
}
