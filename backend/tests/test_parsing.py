from routers.flashcards import try_parse_json, extract_list, mm_node


def test_parse_valid_json():
    assert try_parse_json('{"a": 1}') == {"a": 1}


def test_parse_salvages_surrounding_text():
    assert try_parse_json('Here is the JSON: {"a": 1} thanks!') == {"a": 1}


def test_parse_strips_code_fence():
    assert try_parse_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_parse_garbage_returns_none():
    assert try_parse_json("not json at all") is None


def test_extract_list_from_list():
    assert extract_list([1, 2, 3], "cards") == [1, 2, 3]


def test_extract_list_from_named_key():
    assert extract_list({"cards": [1, 2]}, "cards") == [1, 2]


def test_extract_list_from_other_list_value():
    assert extract_list({"questions": [1]}, "cards") == [1]


def test_extract_list_missing_returns_empty():
    assert extract_list({"x": 1}, "cards") == []


def test_mm_node_standard_tree():
    tree = mm_node({"title": "Root", "children": [{"title": "A", "children": []}]})
    assert tree["title"] == "Root"
    assert tree["children"][0]["title"] == "A"


def test_mm_node_unwraps_topic_as_key():
    tree = mm_node({"Fotosyntese": {"children": [{"title": "A", "children": []}]}}, "fallback")
    assert tree["title"] == "Fotosyntese"
    assert len(tree["children"]) == 1


def test_mm_node_string_child_becomes_leaf():
    tree = mm_node({"title": "R", "children": ["blad"]})
    assert tree["children"][0] == {"title": "blad", "children": []}


def test_mm_node_accepts_alternate_title_key():
    tree = mm_node({"name": "R", "children": []})
    assert tree["title"] == "R"
    assert tree["children"] == []
