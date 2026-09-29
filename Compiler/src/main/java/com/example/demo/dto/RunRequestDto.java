package com.example.demo.dto;
import com.example.demo.entity.types.Language;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

/**
 * Code execution request payload containing source code, target programming language,
 * standard input text, and optional collaborative room context for permission verification.
 */
@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RunRequestDto {
    @JsonAlias({"user", "username"})
    private String userName;

    private Language language;

    private String input;

    private String code;

    private String roomId;
}
