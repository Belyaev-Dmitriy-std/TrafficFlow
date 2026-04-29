package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"google.golang.org/genai"
)

type BatchGeminiResponse struct {
	Decisions []struct {
		ID        string `json:"id"`
		NextPhase string `json:"nextPhase"`
		Reason    string `json:"reason"`
	} `json:"decisions"`
}

func MakeGeminiBatchDecision(city []TrafficState) ([]Decision, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("no API key")
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-2.5-flash"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		return nil, err
	}

	cityJSON, _ := json.Marshal(city)

	prompt := fmt.Sprintf(`
Дай фазу светофора для каждого перекрёстка.

Фазы:
NS_GREEN
EW_GREEN

Данные:
%s

Ответ только JSON:
{"decisions":[{"id":"A1","nextPhase":"NS_GREEN"}]}
`, string(cityJSON))

	resp, err := client.Models.GenerateContent(
		ctx,
		model,
		genai.Text(prompt),
		nil,
	)
	if err != nil {
		return nil, err
	}

	raw := strings.TrimSpace(resp.Text())
	raw = strings.TrimPrefix(raw, "```json")
	raw = strings.TrimPrefix(raw, "```")
	raw = strings.TrimSuffix(raw, "```")
	raw = strings.TrimSpace(raw)

	var parsed BatchGeminiResponse

	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return nil, fmt.Errorf("parse error: %w; raw: %s", err, raw)
	}

	var result []Decision

	for _, d := range parsed.Decisions {
		result = append(result, Decision{
			ID:        d.ID,
			NextPhase: d.NextPhase,
			Reason:    d.Reason,
			Source:    "gemini",
		})
	}

	return result, nil
}