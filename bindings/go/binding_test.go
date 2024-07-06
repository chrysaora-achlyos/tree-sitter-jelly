package tree_sitter_jelly_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-jelly"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_jelly.Language())
	if language == nil {
		t.Errorf("Error loading Jelly grammar")
	}
}
