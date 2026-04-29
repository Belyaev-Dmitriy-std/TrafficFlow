package agent

type TrafficState struct {
	ID           string `json:"id"`
	NorthQueue   int    `json:"northQueue"`
	SouthQueue   int    `json:"southQueue"`
	EastQueue    int    `json:"eastQueue"`
	WestQueue    int    `json:"westQueue"`
	CurrentPhase string `json:"currentPhase"`
}

type Decision struct {
	ID        string `json:"id"`
	NextPhase string `json:"nextPhase"`
	Reason    string `json:"reason"`
	Source    string `json:"source"`
}

func MakeRuleDecision(state TrafficState) Decision {
	nsLoad := state.NorthQueue + state.SouthQueue
	ewLoad := state.EastQueue + state.WestQueue

	if nsLoad > ewLoad+2 {
		return Decision{
			NextPhase: "NS_GREEN",
			Reason:    "Север-Юг перегружен",
			Source:    "rule",
		}
	}

	if ewLoad > nsLoad+2 {
		return Decision{
			NextPhase: "EW_GREEN",
			Reason:    "Восток-Запад перегружен",
			Source:    "rule",
		}
	}

	return Decision{
		NextPhase: state.CurrentPhase,
		Reason:    "Нагрузка равномерная",
		Source:    "rule",
	}
}