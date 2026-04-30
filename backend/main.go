package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"traffic-ai-simulation/backend/internal/agent"
)

var agentMode = "rule"

type BatchRequest struct {
	Intersections []agent.TrafficState `json:"intersections"`
}

type BatchDecision struct {
	ID        string `json:"id"`
	NextPhase string `json:"nextPhase"`
	Reason    string `json:"reason"`
}

type BatchResponse struct {
	Source    string          `json:"source"`
	Reason    string          `json:"reason"`
	Decisions []BatchDecision `json:"decisions"`
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func decisionHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var state agent.TrafficState

	if err := json.NewDecoder(r.Body).Decode(&state); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	decision := agent.MakeRuleDecision(state)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(decision)
}

func decisionBatchHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req BatchRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	source := agentMode
	reason := "Batch обработка города"
	var decisions []agent.Decision

	if agentMode == "gemini" {
		geminiDecisions, err := agent.MakeGeminiBatchDecision(req.Intersections)

		if err != nil {
			log.Println("Gemini batch fallback:", err)

			source = "rule"
			reason = "Gemini недоступен, fallback на rule-based"

			for _, state := range req.Intersections {
				d := agent.MakeRuleDecision(state)
				d.ID = state.ID
				d.Source = "rule"
				decisions = append(decisions, d)
			}
		} else {
			source = "gemini"
			reason = "Gemini обновил фазы города"
			decisions = geminiDecisions
		}
	} else {
		source = "rule"
		reason = "Rule-based обработка города"

		for _, state := range req.Intersections {
			d := agent.MakeRuleDecision(state)
			d.ID = state.ID
			d.Source = "rule"
			decisions = append(decisions, d)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"source":    source,
		"reason":    reason,
		"decisions": decisions,
	})
}

func modeHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Mode string `json:"mode"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if body.Mode != "rule" && body.Mode != "gemini" {
		http.Error(w, "Invalid mode", http.StatusBadRequest)
		return
	}

	agentMode = body.Mode

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"mode": agentMode,
	})
}

func main() {
	_ = godotenv.Load()

	agentMode = os.Getenv("AGENT_MODE")
	if agentMode == "" {
		agentMode = "rule"
	}

	http.HandleFunc("/api/decision", decisionHandler)
	http.HandleFunc("/api/decision-batch", decisionBatchHandler)
	http.HandleFunc("/api/mode", modeHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server started on port:", port)
	log.Println("Agent mode:", agentMode)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}