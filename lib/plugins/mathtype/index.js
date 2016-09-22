(function (factory) {
    if (typeof window.define === 'function') {
        if (window.define.amd) {
            // AMD模式
            window.define(['Edit'],factory);
        } else if (window.define.cmd) {
            // CMD模式
            window.define(function (require, exports, module) {
                return factory;
            });
        } else {
            // 全局模式
            factory(window.Edit);
        }
    } else if (typeof module === "object" && typeof module.exports === "object") {
        // commonjs

        // 引用 css —— webapck
        require('./mathtype.css');
        module.exports = factory(require('simple-editor'));
    } else {
        // 全局模式
        factory(window.Edit);
    }
})(function(Edit){    

    Edit.registerUI('mathtype',function(editor,uiName){

        var MathUrl = editor.options.MathUrl || 'https://www.zhihu.com/equation?tex=';

        var codes = [
            '\\alpha \\beta \\gamma \\delta \\epsilon \\varepsilon \\zeta \\eta \\theta \\vartheta \\iota \\kappa \\lambda \\mu \\nu \\xi \\pi \\varpi \\rho \\varrho \\sigma \\varsigma \\tau \\upsilon \\phi \\varphi \\chi \\psi \\omega \\Gamma \\Delta \\Theta \\Lambda \\Xi \\Pi \\Sigma \\Upsilon \\Phi \\Psi \\Omega'.split(' '),
            '\\times \\div \\cdot \\pm \\mp \\ast \\star \\circ \\bullet \\oplus \\ominus \\oslash \\otimes \\odot \\dagger \\ddagger \\vee \\wedge \\cap \\cup \\aleph \\Re \\Im \\top \\bot \\infty \\partial \\forall \\exists \\neg \\angle \\triangle \\diamond'.split(' '),
            '\\leq \\geq \\prec \\succ \\preceq \\succeq \\ll \\gg \\equiv \\sim \\simeq \\asymp \\approx \\ne \\subset \\supset \\subseteq \\supseteq \\in \\ni \\notin'.split(' '),
            'x_{a};x^{b};x_{a}^{b};\\bar{x};\\tilde{x};\\frac{a}{b};\\sqrt{x};\\sqrt[n]{x};\\bigcap_{a}^{b};\\bigcup_{a}^{b};\\prod_{a}^{b};\\coprod_{a}^{b};\\left( x \\right);\\left[ x \\right];\\left\\{ x \\right\\};\\left| x \\right|;\\int_{a}^{b};\\oint_{a}^{b};\\sum_{a}^{b}{x};\\lim_{a \\rightarrow b}{x}'.split(';'),
            '\\leftarrow \\rightarrow \\leftrightarrow \\Leftarrow \\Rightarrow \\Leftrightarrow \\uparrow \\downarrow \\updownarrow \\Uparrow \\Downarrow \\Updownarrow'.split(' ')
        ];  

        var offsets = [
            { width: 18, height: 18, left: 0, top: 30 },
            { width: 18, height: 18, left: 0, top: 50 },
            { width: 18, height: 18, left: 0, top: 70 },
            { width: 30, height: 56, left: 0, top: 90 },
            { width: 18, height: 18, left: 0, top: 150 }
        ];

        
        var popupDom, textArea, imgPreview, MathItmeActive;

        function mathDialog(codes,offsets) {
            var self = this;
            var ce  = Edit.ui.createEl;            
            return ce('div',{class:'eui-dialog',style:Edit.ui.getPanelOffset(self.id)},[
                ce('div',{class:'panel-box'},[
                    ce('ul',{class:'math-menu'},
                        codes.map(function(code,index){
                            return ce('li',{id:'popup-btn-'+index,class:'math-item math-code',style:'width:46px;height:18px;background-position:'+(-index*46)+'px 1px;'},{
                                click: function(){
                                    if (this.contains(popupDom)) return;
                                    var currentPopup = document.querySelector('#editor-popup');
                                    currentPopup && currentPopup.parentNode.removeChild(currentPopup);
                                    var popup = new Edit.ui.Popup({
                                        content: ce('div',{id:'editor-popup',style:getPopupOffset.call(Edit.ui, this.id)},[
                                            ce('ul',{class:'math-code-list',},
                                                codes[index].map(function(item, num){
                                                    return ce('li',{class:'math-code-item'},[
                                                        ce('span',{class:'math-code',style:'width:'+ offsets[index].width +'px;height:'+ offsets[index].height +'px;background-position:'+ -offsets[index].width*num +'px '+ -offsets[index].top +'px'})
                                                    ],{click: function(){
                                                        if (textArea && imgPreview) {
                                                            textArea.value = textArea.value + item + ' ';
                                                            imgPreview.src = MathUrl + textArea.value;
                                                        }
                                                    }})
                                                })
                                            )
                                        ])
                                    });
                                    popupDom = popup.show(this);
                                    MathItmeActive && MathItmeActive.classList.remove('math-item-active');
                                    (MathItmeActive = this).classList.add('math-item-active');
                                }
                            })
                        })
                    ),
                    ce('textarea',{id:'math-text',class:'math-text'},{
                        keyup: function(){
                            if (imgPreview) {
                                imgPreview.src = MathUrl + this.value;
                            }
                        }
                    }),
                    ce('p',{style:'color:#666;margin: 10px auto 5px;'},['预览']),
                    ce('div',{class:'math-preview'},[
                        ce('img',{id:'math-preview-img',class:'math-preview-img'})
                    ]),
                    ce('div',{class:'panel-handles'},[
                        ce('span',{class:'panel-cancel'},['取消'],{click:function(){Edit.ui.closePopup()}}),
                        ce('span',{class:'panel-confirm'},['确定'],{click:insertMath})
                    ])
                ])
            ]);
        }      

        function getPopupOffset(id) {
			return 'position:absolute;left:-1px;bottom:'+(this.height(id)+6)+'px';
		}	

        function insertMath() {
            var src = document.getElementById('math-preview-img').getAttribute('src');
            if (src) {
                editor.execCommand('inserthtml','<img src="'+src+'">');
                Edit.ui.closePopup();
            }
        }  

        var btn = new Edit.ui.Button({
            name:uiName,
            title:'公式',
            className: 'eicon-math',
            handles: {
                click: function () {
                    if (btn.isDisabled()) return;
                    var self = this;
                    var ce = Edit.ui.createEl;
                    var menu = new Edit.ui.Menu({
                        content: mathDialog.call(self,codes,offsets)
                    });
                    var menuDom = menu.show();
                    textArea = document.querySelector('#math-text');
                    imgPreview = document.querySelector('#math-preview-img');
                    Edit.ui.dialogOffset(editor);
                    editor.bind(menuDom, 'click', function(ev){
                        var current = ev.target;
                        if (popupDom) {                                
                            if (!popupDom.contains(current) && !current.contains(popupDom)) {
                                popupDom.parentNode.removeChild(popupDom);
                                popupDom = null;
                                MathItmeActive && MathItmeActive.classList.remove('math-item-active');
                            }
                        }
                    })
                }
            }
        });	      

        return btn;
    });

    return Edit;		
});